# JEE Test Generator Backend

Production-oriented Flask backend for adaptive JEE-style test generation.

## Stack

- PostgreSQL stores PDFs, questions, images, tests, and analytics metadata.
- FAISS stores persistent semantic indexes in `storage/`.
- SentenceTransformers (`all-MiniLM-L6-v2`) builds embeddings.
- Groq converts extracted source questions into validated MCQs when needed.

## Layout

- `app.py` - Flask app factory and blueprint registration.
- `database/` - SQLAlchemy extension and models.
- `ingestion/` - PDF extraction, question parsing, image association, answer linking, incremental ingest.
- `rag/` - embeddings, retrieval, generation, validation.
- `analytics/` - weak-topic analysis and recommendations.
- `routes/` - frontend-compatible API routes.
- `uploads/pdfs/` - source PDFs.
- `extracted_images/` - image assets extracted from PDFs.
- `storage/` - `faiss.index`, `processed_pdfs.json`, `questions.pkl`, `images.pkl`.

## Run

```bash
pip install -r requirements.txt
docker compose up -d
python ingest.py
python app.py
```

Copy `.env.example` to `.env` and set `DATABASE_URL` plus `GROQ_API_KEY` for production use. Use a SQLAlchemy URL such as `postgresql+psycopg://postgres:postgres@localhost:5432/jeeace`. If `DATABASE_URL` is omitted, SQLite is used for local development.
