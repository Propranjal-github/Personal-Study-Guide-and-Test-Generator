
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
dotenv_path = BASE_DIR / ".env"
load_dotenv(dotenv_path)

# Core paths
PDF_DIR = Path(os.getenv("PDF_DIR", BASE_DIR / "uploads" / "pdfs"))
IMAGE_DIR = Path(os.getenv("IMAGE_DIR", BASE_DIR / "extracted_images"))
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", BASE_DIR / "storage"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
VECTOR_CACHE_DIR = Path(os.getenv("VECTOR_CACHE_DIR", BASE_DIR / "vector_cache"))
LOG_DIR = Path(os.getenv("LOG_DIR", BASE_DIR / "logs"))

for p in [PDF_DIR, IMAGE_DIR, STORAGE_DIR, UPLOAD_DIR, VECTOR_CACHE_DIR, LOG_DIR]:
    p.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'jeeace.db'}")

# Flask
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Embeddings / FAISS
EMBEDDER_NAME = os.getenv("EMBEDDER_NAME", "all-MiniLM-L6-v2")
EMBEDDING_FALLBACK_ONLY = os.getenv("EMBEDDING_FALLBACK_ONLY", "false").lower() == "true"
QUESTION_INDEX_PATH = STORAGE_DIR / "faiss.index"
QUESTION_ID_MAP_PATH = STORAGE_DIR / "questions.pkl"
IMAGE_INDEX_PATH = STORAGE_DIR / "faiss_images.index"
IMAGE_ID_MAP_PATH = STORAGE_DIR / "images.pkl"
PROCESSED_PDFS_PATH = STORAGE_DIR / "processed_pdfs.json"

# Runtime
AUTO_INGEST_ON_STARTUP = os.getenv("AUTO_INGEST_ON_STARTUP", "true").lower() == "true"
MAX_GENERATE_COUNT = int(os.getenv("MAX_GENERATE_COUNT", "25"))
DEFAULT_TIME_LIMIT = int(os.getenv("DEFAULT_TIME_LIMIT", "3600"))

# Matching thresholds
MIN_IMAGE_SIMILARITY = float(os.getenv("MIN_IMAGE_SIMILARITY", "0.58"))
MIN_IMAGE_OVERLAP = int(os.getenv("MIN_IMAGE_OVERLAP", "2"))
MIN_QUESTION_SIMILARITY = float(os.getenv("MIN_QUESTION_SIMILARITY", "0.45"))
