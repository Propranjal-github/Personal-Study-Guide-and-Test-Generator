import logging
import os

from flask import Flask
from flask_cors import CORS

from config import (
    CORS_ORIGINS,
    DATABASE_URL,
    LOG_DIR,
    SECRET_KEY,
)

from database.db import db
from routes.analytics_routes import analytics_bp
from routes.question_routes import question_bp


def create_app():
    print("STEP 1: Creating Flask app")

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

    print("STEP 2: Configuring CORS")

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    print("STEP 3: Initializing database")

    db.init_app(app)

    print("STEP 4: Registering blueprints")

    app.register_blueprint(question_bp)
    app.register_blueprint(analytics_bp)

    @app.route("/")
    def health():
        return {
            "status": "healthy",
            "database": "connected"
        }, 200

    print("STEP 5: Creating tables")

    with app.app_context():
        db.create_all()

    print("STEP 6: Startup complete")

    return app


# Gunicorn entrypoint
app = create_app()


if __name__ == "__main__":
    print("Starting JEE Test Generator Backend")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )