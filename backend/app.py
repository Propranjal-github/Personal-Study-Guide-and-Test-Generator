import logging
import os

from flask import Flask
from flask_cors import CORS

from config import AUTO_INGEST_ON_STARTUP, CORS_ORIGINS, DATABASE_URL, LOG_DIR, SECRET_KEY
from database.db import db
from database.models import ImageAsset, Question
from ingestion.ingest import ingest_all_pdfs
from rag.embeddings import faiss_store
from routes.analytics_routes import analytics_bp
from routes.question_routes import question_bp

print("===== STARTING APPLICATION =====")
print("AUTO_INGEST_ON_STARTUP =", AUTO_INGEST_ON_STARTUP)


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False

    logging.basicConfig(
        filename=LOG_DIR / "backend.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    #CORS(app, origins=CORS_ORIGINS, supports_credentials=True)
    from flask_cors import CORS

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    db.init_app(app)
    app.register_blueprint(question_bp)
    app.register_blueprint(analytics_bp)
    
    with app.app_context():
        db.create_all()

        try:
            question_count = Question.query.count()

            app.logger.info(
                f"Database contains {question_count} questions"
            )

            if question_count == 0 and AUTO_INGEST_ON_STARTUP:
                app.logger.info(
                    "Database empty. Starting first-time PDF ingestion..."
                )

                ingest_all_pdfs(db.session)

                app.logger.info(
                    "Initial ingestion completed successfully"
                )

            else:
                app.logger.info(
                    "Questions already exist. Rebuilding FAISS from database..."
                )

                faiss_store.rebuild_from_db(
                    db.session,
                    Question,
                    ImageAsset
                )

                app.logger.info(
                    "FAISS rebuild completed successfully"
                )

        except Exception as exc:
            app.logger.error(
                f"Startup initialization failed: {exc}"
            )

    return app

# Gunicorn entrypoint
app = create_app()

if __name__ == "__main__":
    print("Starting JEE Test Generator Backend")
    app.run(
        debug=True,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )

