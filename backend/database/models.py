
import uuid
from datetime import datetime, timezone
from sqlalchemy import func
from database.db import db

def utcnow():
    return datetime.now(timezone.utc)

class PDFDocument(db.Model):
    __tablename__ = "pdf_documents"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), unique=True, nullable=False, index=True)
    file_hash = db.Column(db.String(64), nullable=False, index=True)
    status = db.Column(db.String(50), default="processed", nullable=False)
    uploaded_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    processed_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    total_questions = db.Column(db.Integer, default=0)
    total_images = db.Column(db.Integer, default=0)

    questions = db.relationship("Question", back_populates="pdf", cascade="all, delete-orphan", lazy=True)
    images = db.relationship("ImageAsset", back_populates="pdf", cascade="all, delete-orphan", lazy=True)

class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pdf_id = db.Column(db.String(36), db.ForeignKey("pdf_documents.id", ondelete="CASCADE"), nullable=False, index=True)

    question_number = db.Column(db.Integer, nullable=True, index=True)
    raw_text = db.Column(db.Text, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    embedding_text = db.Column(db.Text, nullable=False)

    subject = db.Column(db.String(100), nullable=True, index=True)
    topic = db.Column(db.String(120), nullable=True, index=True)
    difficulty = db.Column(db.String(30), default="medium", index=True)

    page = db.Column(db.Integer, nullable=True, index=True)
    source_pdf = db.Column(db.String(255), nullable=False)

    options = db.Column(db.JSON, nullable=True)
    answer_letter = db.Column(db.String(10), nullable=True)
    answer_text = db.Column(db.Text, nullable=True)
    solution = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    pdf = db.relationship("PDFDocument", back_populates="questions")
    image_links = db.relationship("QuestionImageAssociation", back_populates="question", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "question_number": self.question_number,
            "text": self.question_text,
            "raw_text": self.raw_text,
            "subject": self.subject,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "page": self.page,
            "source_pdf": self.source_pdf,
            "options": self.options or [],
            "answer_letter": self.answer_letter,
            "answer_text": self.answer_text,
            "solution": self.solution,
        }

class ImageAsset(db.Model):
    __tablename__ = "images"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pdf_id = db.Column(db.String(36), db.ForeignKey("pdf_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = db.Column(db.Text, nullable=False)
    caption = db.Column(db.Text, nullable=True)
    surrounding_text = db.Column(db.Text, nullable=True)

    page = db.Column(db.Integer, nullable=True, index=True)
    subject = db.Column(db.String(100), nullable=True, index=True)

    x = db.Column(db.Float, nullable=True)
    y = db.Column(db.Float, nullable=True)
    width = db.Column(db.Float, nullable=True)
    height = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    pdf = db.relationship("PDFDocument", back_populates="images")
    question_links = db.relationship("QuestionImageAssociation", back_populates="image", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "image_path": self.image_path,
            "caption": self.caption,
            "surrounding_text": self.surrounding_text,
            "page": self.page,
            "subject": self.subject,
            "position": {
                "x": self.x,
                "y": self.y,
                "width": self.width,
                "height": self.height,
            },
        }

class QuestionImageAssociation(db.Model):
    __tablename__ = "question_image_associations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = db.Column(db.String(36), db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    image_id = db.Column(db.String(36), db.ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True)

    similarity_score = db.Column(db.Float, default=0.0)
    caption_overlap = db.Column(db.Integer, default=0)
    association_type = db.Column(db.String(50), default="semantic_strict")
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    question = db.relationship("Question", back_populates="image_links")
    image = db.relationship("ImageAsset", back_populates="question_links")

class TestPlan(db.Model):
    __tablename__ = "test_plans"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(255), nullable=False, index=True)
    test_type = db.Column(db.String(100), default="custom")
    subjects = db.Column(db.JSON, default=list)
    total_questions = db.Column(db.Integer, default=0)
    time_limit = db.Column(db.Integer, default=3600)
    questions = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

class TestResult(db.Model):
    __tablename__ = "test_results"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(255), nullable=False, index=True)
    user_email = db.Column(db.String(255), nullable=True)
    test_id = db.Column(db.String(255), nullable=False, index=True)
    test_name = db.Column(db.String(255), nullable=True)
    test_type = db.Column(db.String(100), default="custom")
    subjects = db.Column(db.JSON, default=list)
    total_questions = db.Column(db.Integer, default=0)
    results = db.Column(db.JSON, default=dict)
    time_taken = db.Column(db.Integer, default=0)
    time_limit = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

class WeakTopic(db.Model):
    __tablename__ = "weak_topics"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(255), nullable=False, index=True)
    topic = db.Column(db.String(255), nullable=False, index=True)
    subject = db.Column(db.String(100), nullable=True, index=True)
    weight = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
