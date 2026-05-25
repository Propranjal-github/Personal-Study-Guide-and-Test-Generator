
import os
import re
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

import fitz
from PIL import Image as PILImage

from config import IMAGE_DIR, MIN_IMAGE_SIMILARITY, MIN_IMAGE_OVERLAP
from rag.validation import (
    clean_pdf_text,
    detect_subject_from_text,
    extract_question_number,
    is_valid_question_text,
    parse_options_from_block,
    normalize_text,
    image_relevance_score,
)
from rag.embeddings import faiss_store

QUESTION_PATTERNS = [
    r'(\d+\.\s+.*?(?=\d+\.\s+|\n\n|\Z))',
    r'(Q\d+\.\s+.*?(?=Q\d+\.\s+|\n\n|\Z))',
    r'(\(\d+\)\s+.*?(?=\(\d+\)|\n\n|\Z))',
    r'(Example\s+\d+.*?(?=Example\s+\d+|\n\n|\Z))',
    r'([A-Z][^.]{20,450}\?)',
]

ANSWER_PATTERNS = [
    r'(\d{1,4})\s*[\.\)\-:]\s*([ABCD])\b',
    r'Q\s*(\d{1,4})\s*[:\-]\s*([ABCD])\b',
]

def calculate_text_similarity(text1: str, text2: str, embedder, cosine_similarity) -> float:
    if not text1 or not text2:
        return 0.0
    try:
        embeddings = embedder.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except Exception:
        return 0.0

def extract_answer_map(text: str) -> Dict[int, str]:
    text = clean_pdf_text(text)
    answer_map = {}
    for pat in ANSWER_PATTERNS:
        for qnum, ans in re.findall(pat, text, flags=re.IGNORECASE):
            try:
                answer_map[int(qnum)] = ans.upper()
            except Exception:
                continue
    return answer_map

def parse_question_block(block: str):
    """
    Returns dict with:
    - question_number
    - question_text (stem)
    - options
    """
    raw = clean_pdf_text(block)
    qnum = extract_question_number(raw)

    # remove leading question number token for better stem parsing
    stem = re.sub(r'^\s*(?:Q(?:uestion)?\s*)?\d{1,4}\s*[\.\)\-:]\s*', '', raw, flags=re.IGNORECASE).strip()
    options = parse_options_from_block(stem)

    if options:
        # remove option labels from stem by cutting at first option label
        first_opt = re.search(r'(?:^|\n)\s*A[\.\)\-:]', stem, flags=re.IGNORECASE)
        if first_opt:
            stem = stem[:first_opt.start()].strip()
        stem = normalize_text(stem)
    else:
        stem = normalize_text(stem)

    return {
        "question_number": qnum,
        "question_text": stem,
        "options": options,
    }

def extract_questions_from_text(text, page_num, filename, subject):
    text = clean_pdf_text(text)
    questions = []
    seen = set()

    for i, pattern in enumerate(QUESTION_PATTERNS):
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            candidate = normalize_text(match)
            if candidate in seen:
                continue
            seen.add(candidate)

            if not is_valid_question_text(candidate):
                continue

            q_subject = detect_subject_from_text(candidate, subject)
            if subject != "All" and q_subject and q_subject != subject:
                continue

            parsed = parse_question_block(candidate)
            qnum = parsed["question_number"]
            qtext = parsed["question_text"] or candidate
            opts = parsed["options"]

            embedding_text = qtext if not opts else qtext + " " + " | ".join(opts)

            questions.append({
                "id": str(uuid.uuid4()),
                "question_number": qnum,
                "raw_text": candidate,
                "text": qtext,
                "embedding_text": embedding_text,
                "options": opts,
                "page": page_num + 1,
                "source_pdf": filename,
                "subject": q_subject or subject or "Unknown",
                "topic": detect_subject_from_text(qtext, q_subject or subject) or "General",
                "difficulty": "medium",
                "answer_letter": None,
                "answer_text": None,
                "solution": None,
                "extraction_pattern": i,
                "word_count": len(candidate.split()),
            })

    return questions

def extract_text_near_image(page, img_rect, distance_threshold=100):
    words = page.get_text("words")
    nearby_words = []
    for word in words:
        word_rect = fitz.Rect(word[:4])
        distance = min(
            abs(word_rect.x0 - img_rect.x1),
            abs(word_rect.x1 - img_rect.x0),
            abs(word_rect.y0 - img_rect.y1),
            abs(word_rect.y1 - img_rect.y0),
        )
        if distance <= distance_threshold:
            nearby_words.append(word[4])
    return " ".join(nearby_words)

def extract_images_from_page(doc, page, page_num, filename, current_subject, output_dir=IMAGE_DIR):
    extracted_images = []
    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        image_filename = f"{filename}_p{page_num+1}_img{img_index+1}.{image_ext}"
        image_path = Path(output_dir) / image_filename
        image_path.parent.mkdir(parents=True, exist_ok=True)
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        img_rect = fitz.Rect(img[1:5])
        nearby_text = normalize_text(extract_text_near_image(page, img_rect, distance_threshold=100))

        if len(nearby_text) < 10:
            continue

        extracted_images.append({
            "id": str(uuid.uuid4()),
            "image_path": str(image_path),
            "page": page_num + 1,
            "source_pdf": filename,
            "subject": current_subject or "Unknown",
            "position": {
                "x": img_rect.x0,
                "y": img_rect.y0,
                "width": img_rect.width,
                "height": img_rect.height,
            },
            "caption": nearby_text,
            "surrounding_text": page.get_text(),
        })
    return extracted_images

def process_pdf_file(pdf_path, output_dir=IMAGE_DIR):
    """
    Extract questions, images, and image associations from a single PDF.
    """
    doc = fitz.open(pdf_path)
    filename = os.path.basename(pdf_path)

    extracted_questions = []
    extracted_images = []
    associations = []
    answer_maps = []

    current_subject = None

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = clean_pdf_text(page.get_text())

        page_subject = detect_subject_from_text(text, current_subject)
        if page_subject:
            current_subject = page_subject

        questions_on_page = extract_questions_from_text(text, page_num, filename, current_subject or "All")
        extracted_questions.extend(questions_on_page)

        page_answer_map = extract_answer_map(text)
        if page_answer_map:
            answer_maps.append(page_answer_map)

        for image_data in extract_images_from_page(doc, page, page_num, filename, current_subject, output_dir):
            extracted_images.append(image_data)

            for question in questions_on_page:
                q_text = question.get("text", "")
                q_subject = question.get("subject", current_subject)

                if not is_valid_question_text(q_text):
                    continue

                if current_subject and q_subject and q_subject != current_subject:
                    continue

                similarity_score = 0.0
                try:
                    from sklearn.metrics.pairwise import cosine_similarity as _cos
                    q_vec = faiss_store.embed_texts([q_text])
                    image_text = image_data["caption"] + " " + image_data["surrounding_text"][:500]
                    i_vec = faiss_store.embed_texts([image_text])
                    similarity_score = float(_cos(q_vec, i_vec)[0][0])
                except Exception:
                    similarity_score = 0.0

                # caller may compute embeddings later; we keep a lightweight lexical overlap gate here
                overlap_score = image_relevance_score(q_text, image_data["caption"], image_data["surrounding_text"])

                if (
                    question["page"] == image_data["page"]
                    and q_subject == image_data["subject"]
                    and similarity_score >= MIN_IMAGE_SIMILARITY
                    and overlap_score >= MIN_IMAGE_OVERLAP
                ):
                    associations.append({
                        "question_id": question["id"],
                        "image_id": image_data["id"],
                        "similarity_score": similarity_score,
                        "caption_overlap": overlap_score,
                        "question_page": question["page"],
                        "image_page": image_data["page"],
                        "question_subject": q_subject,
                        "image_subject": image_data["subject"],
                        "association_type": "semantic_strict",
                    })

    # merge answer maps
    merged_answers = {}
    for amap in answer_maps:
        merged_answers.update(amap)

    # link answers to questions by number
    for q in extracted_questions:
        qnum = q.get("question_number")
        if qnum and qnum in merged_answers:
            q["answer_letter"] = merged_answers[qnum]
            q["answer_text"] = merged_answers[qnum]

    doc.close()
    return extracted_questions, extracted_images, associations


def extract_pdf_data_enhanced(pdf_path, output_dir=IMAGE_DIR):
    return process_pdf_file(pdf_path, output_dir)

def serialize_image_to_base64(image_path: str) -> str:
    path = Path(image_path)
    if not path.exists():
        return ""
    ext = path.suffix.lower().replace(".", "")
    if ext == "jpg":
        mime = "jpeg"
    else:
        mime = ext or "png"
    import base64
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/{mime};base64,{data}"
