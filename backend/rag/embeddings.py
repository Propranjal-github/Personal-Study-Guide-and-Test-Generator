
import pickle
import hashlib
import threading
import numpy as np
import faiss

print("LOADING embeddings")

from config import (
    EMBEDDER_NAME,
    EMBEDDING_FALLBACK_ONLY,
    QUESTION_INDEX_PATH,
    QUESTION_ID_MAP_PATH,
    IMAGE_INDEX_PATH,
    IMAGE_ID_MAP_PATH,
)
from rag.validation import normalize_text

class FaissStore:
    def __init__(self):
        self.embedder = None
        self.embedder_failed = False
        self.lock = threading.RLock()

        self.question_index = None
        self.image_index = None

        self.question_ids = []
        self.image_ids = []

        self._load_or_init()

    def _new_index(self):
        return faiss.IndexFlatL2(384)

    def _get_embedder(self):
        if EMBEDDING_FALLBACK_ONLY:
            self.embedder_failed = True
            return None
        if self.embedder or self.embedder_failed:
            return self.embedder
        try:
            from sentence_transformers import SentenceTransformer
            self.embedder = SentenceTransformer(EMBEDDER_NAME)
        except Exception as exc:
            self.embedder_failed = True
            print(f"Embedding model unavailable, using local fallback vectors: {exc}")
        return self.embedder

    def _load_or_init(self):
        with self.lock:
            self.question_index = self._new_index()
            self.image_index = self._new_index()

            if QUESTION_INDEX_PATH.exists():
                self.question_index = faiss.read_index(str(QUESTION_INDEX_PATH))
            if IMAGE_INDEX_PATH.exists():
                self.image_index = faiss.read_index(str(IMAGE_INDEX_PATH))

            if QUESTION_ID_MAP_PATH.exists():
                with open(QUESTION_ID_MAP_PATH, "rb") as f:
                    self.question_ids = pickle.load(f)
            if IMAGE_ID_MAP_PATH.exists():
                with open(IMAGE_ID_MAP_PATH, "rb") as f:
                    self.image_ids = pickle.load(f)

    def save(self):
        with self.lock:
            faiss.write_index(self.question_index, str(QUESTION_INDEX_PATH))
            faiss.write_index(self.image_index, str(IMAGE_INDEX_PATH))
            with open(QUESTION_ID_MAP_PATH, "wb") as f:
                pickle.dump(self.question_ids, f)
            with open(IMAGE_ID_MAP_PATH, "wb") as f:
                pickle.dump(self.image_ids, f)

    def clear(self):
        with self.lock:
            self.question_index = self._new_index()
            self.image_index = self._new_index()
            self.question_ids = []
            self.image_ids = []
            self.save()

    def embed_texts(self, texts):
        texts = [normalize_text(t) for t in texts]
        if not texts:
            return np.zeros((0, 384), dtype="float32")
        embedder = self._get_embedder()
        if embedder is None:
            return self._fallback_embed_texts(texts)
        vectors = embedder.encode(texts, convert_to_numpy=True, normalize_embeddings=False)
        return np.array(vectors, dtype="float32")

    def _fallback_embed_texts(self, texts):
        vectors = []
        for text in texts:
            vector = np.zeros(384, dtype="float32")
            for token in text.lower().split():
                digest = hashlib.md5(token.encode("utf-8")).digest()
                index = int.from_bytes(digest[:2], "little") % 384
                sign = 1.0 if digest[2] % 2 == 0 else -1.0
                vector[index] += sign
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm
            vectors.append(vector)
        return np.array(vectors, dtype="float32")

    def rebuild_from_db(self, session, Question, ImageAsset):

        with self.lock:
            self.question_index = self._new_index()
            self.image_index = self._new_index()
            self.question_ids = []
            self.image_ids = []

            questions = session.query(Question).order_by(Question.created_at.asc()).all()
            q_texts = [q.embedding_text or q.question_text for q in questions]
            q_vectors = self.embed_texts(q_texts)
            if len(questions) and len(q_vectors):
                self.question_index.add(q_vectors)
                self.question_ids = [q.id for q in questions]

            images = session.query(ImageAsset).order_by(ImageAsset.created_at.asc()).all()
            i_texts = [(img.caption or "") + " " + (img.surrounding_text or "")[:500] for img in images]
            i_vectors = self.embed_texts(i_texts)
            if len(images) and len(i_vectors):
                self.image_index.add(i_vectors)
                self.image_ids = [img.id for img in images]

            self.save()

    def add_questions(self, question_records):
        texts = [q.get("embedding_text") or q.get("question_text") or q.get("question") for q in question_records]
        ids = [q["id"] for q in question_records]
        vectors = self.embed_texts(texts)
        with self.lock:
            if len(vectors):
                self.question_index.add(vectors)
                self.question_ids.extend(ids)
                self.save()

    def add_images(self, image_records):
        texts = [(img.get("caption", "") + " " + (img.get("surrounding_text", "")[:500])) for img in image_records]
        ids = [img["id"] for img in image_records]
        vectors = self.embed_texts(texts)
        with self.lock:
            if len(vectors):
                self.image_index.add(vectors)
                self.image_ids.extend(ids)
                self.save()

    def search_questions(self, query, k=10):
        with self.lock:
            if self.question_index.ntotal == 0 or not self.question_ids:
                return []
            q_vec = self.embed_texts([query])
            if q_vec.size == 0:
                return []
            k = min(k, len(self.question_ids))
            distances, indices = self.question_index.search(q_vec, k)
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.question_ids):
                    continue
                results.append({
                    "id": self.question_ids[idx],
                    "distance": float(dist),
                })
            return results

    def search_images(self, query, k=5):
        with self.lock:
            if self.image_index.ntotal == 0 or not self.image_ids:
                return []
            q_vec = self.embed_texts([query])
            if q_vec.size == 0:
                return []
            k = min(k, len(self.image_ids))
            distances, indices = self.image_index.search(q_vec, k)
            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.image_ids):
                    continue
                results.append({
                    "id": self.image_ids[idx],
                    "distance": float(dist),
                })
            return results

_faiss_store = None

def get_faiss_store():
    global _faiss_store

    if _faiss_store is None:
        print("Initializing FAISS Store...")
        _faiss_store = FaissStore()

    return _faiss_store