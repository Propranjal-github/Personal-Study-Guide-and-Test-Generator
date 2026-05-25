from app import create_app
from database.db import db
from ingestion.ingest import ingest_all_pdfs


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        report = ingest_all_pdfs(db.session)
        for item in report:
            print(item)

