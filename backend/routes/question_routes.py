from datetime import datetime, timezone
import os
import time

from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sklearn.metrics.pairwise import cosine_similarity

print("LOADING question_routes")

from analytics.weak_topics import extract_topic_from_text, get_user_weak_topics_with_weights
from config import DEFAULT_TIME_LIMIT, IMAGE_DIR, MAX_GENERATE_COUNT, PDF_DIR
from database.db import db
from database.models import ImageAsset, Question, QuestionImageAssociation, TestPlan
from ingestion.ingest import ingest_single_pdf
from ingestion.pdf_processor import serialize_image_to_base64
from rag.embeddings import get_faiss_store
from rag.generation import generate_enhanced_mcq
from rag.retrieval import filter_questions_by_subject, retrieve_relevant_questions
from rag.validation import image_relevance_score, is_valid_question_text, normalize_text

question_bp = Blueprint("question_routes", __name__)


def _attach_relevant_image(question, question_obj):
    assoc = (
        db.session.query(QuestionImageAssociation)
        .filter(QuestionImageAssociation.question_id == question.id)
        .order_by(
            QuestionImageAssociation.similarity_score.desc(),
            QuestionImageAssociation.caption_overlap.desc(),
        )
        .first()
    )
    if not assoc:
        return

    image = db.session.get(ImageAsset, assoc.image_id)
    if not image or image.page != question.page or image.subject != question.subject:
        return

    overlap = image_relevance_score(question.question_text, image.caption, image.surrounding_text)
    if overlap < 2 or not os.path.exists(image.image_path):
        return

    question_obj["image_data"] = serialize_image_to_base64(image.image_path)
    question_obj["image_caption"] = image.caption


@question_bp.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "questions": db.session.query(Question).count(),
        "images": db.session.query(ImageAsset).count(),
    }), 200


@question_bp.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    pdf_path = PDF_DIR / file.filename
    file.save(pdf_path)

    try:
        result = ingest_single_pdf(db.session, pdf_path)
        get_faiss_store().rebuild_from_db(db.session, Question, ImageAsset)
        return jsonify({
            "message": "PDF processed successfully",
            "questions_extracted": result["questions"],
            "images_extracted": result["images"],
            "associations_found": result["associations"],
            "pdf_name": file.filename,
            "skipped": result.get("skipped", False),
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    
@question_bp.route("/api/admin/reingest", methods=["POST"])
def reingest():
    try:
        from ingestion.ingest import ingest_all_pdfs
        from database.models import Question, ImageAsset

        report = ingest_all_pdfs(db.session)

        return {
            "success": True,
            "report": report,
            "questions": Question.query.count(),
            "images": ImageAsset.query.count()
        }, 200

    except Exception as e:
        return {"error": str(e)}, 500

from database.models import Question, ImageAsset


@question_bp.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    return {
        "questions": Question.query.count(),
        "images": ImageAsset.query.count()
    }, 200


@question_bp.route("/api/generate-questions", methods=["POST"])
def generate_questions_api():
    try:
        payload = request.get_json(force=True) or {}
        subject = payload.get("subject", "All")
        count = min(int(payload.get("count", 10)), MAX_GENERATE_COUNT)
        topics = payload.get("topics", [])
        topic_filter = topics[0] if topics else payload.get("topic")
        user_id = payload.get("userId")
        use_recommendations = payload.get("useRecommendations", False)
        difficulty = payload.get("difficulty", "medium")

        weak_topics_weights = {}
        weak_topics = []
        recommendations_applied = False
        weighted_rag_used = False

        if use_recommendations and user_id:
            weak_topics_weights = get_user_weak_topics_with_weights(db.session, user_id)
            weak_topics = list(weak_topics_weights.keys())
            recommendations_applied = bool(weak_topics)
            weighted_rag_used = bool(weak_topics)

        if topic_filter:
            candidates = retrieve_relevant_questions(
                db.session,
                topic_filter,
                subject,
                k=count * 4,
                topic_filter=topic_filter,
                weak_topics_weights=weak_topics_weights,
                difficulty=difficulty,
            )
        elif weak_topics_weights:
            candidates = retrieve_relevant_questions(
                db.session,
                " ".join(weak_topics[:3]) if weak_topics else subject,
                subject,
                k=count * 4,
                weak_topics_weights=weak_topics_weights,
                difficulty=difficulty,
            )
        else:
            candidates = filter_questions_by_subject(db.session, subject, k=count * 4)

        generated_questions = []
        for index, question in enumerate(candidates):
            if len(generated_questions) >= count:
                break
            if not is_valid_question_text(question.question_text):
                continue
            if index > 0:
                time.sleep(2)

            mcq = generate_enhanced_mcq({
                "id": question.id,
                "text": question.question_text,
                "raw_text": question.raw_text,
                "question_text": question.question_text,
                "options": question.options or [],
                "answer_letter": question.answer_letter,
                "answer_text": question.answer_text,
                "solution": question.solution,
                "subject": question.subject,
                "page": question.page,
                "source_pdf": question.source_pdf,
                "topic": question.topic,
            })
            if not mcq:
                continue

            try:
                source_emb = get_faiss_store().embed_texts([normalize_text(question.question_text)])
                generated_emb = get_faiss_store().embed_texts([normalize_text(mcq.get("question", ""))])
                qsim = float(cosine_similarity(source_emb, generated_emb)[0][0])
            except Exception:
                qsim = 1.0
            if qsim < 0.45:
                continue

            question_obj = {
                "question": mcq["question"],
                "options": mcq["options"],
                "answer": mcq["correct_answer"],
                "subject": question.subject or subject or "Unknown",
                "topic": question.topic or extract_topic_from_text(question.question_text),
                "difficulty": question.difficulty or difficulty,
                "source_text": (question.raw_text or question.question_text)[:300],
                "page": question.page,
                "pdf_source": question.source_pdf,
                "solution": mcq.get("solution", ""),
            }
            _attach_relevant_image(question, question_obj)
            generated_questions.append(question_obj)

        return jsonify({
            "questions": generated_questions,
            "subject": subject,
            "count": len(generated_questions),
            "difficulty": difficulty,
            "total_questions_in_db": db.session.query(Question).count(),
            "total_images_in_db": db.session.query(ImageAsset).count(),
            "weak_topics_used": weak_topics if use_recommendations else [],
            "topic_weights_applied": weak_topics_weights if use_recommendations else {},
            "recommendations_applied": recommendations_applied,
            "weighted_rag_used": weighted_rag_used,
            "rag_metrics": {
                "high_priority_questions": len(generated_questions),
                "medium_priority_questions": 0,
                "low_priority_questions": 0,
                "average_weight": 0.0,
                "effectiveness_score": 1.0 if generated_questions else 0.0,
                "total_weak_topics_targeted": len(weak_topics),
                "questions_with_topic_match": sum(1 for q in generated_questions if q.get("topic")),
            },
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@question_bp.route("/api/admin/stats")
def stats():
    return {
        "questions": Question.query.count(),
        "images": ImageAsset.query.count()
    }


@question_bp.route("/api/save-test", methods=["POST"])
def save_test():
    data = request.get_json(force=True) or {}
    user_id = data.get("userId")
    test_config = data.get("testConfig")
    if not user_id or not test_config:
        return jsonify({"error": "Missing userId or testConfig"}), 400

    test = TestPlan(
        user_id=user_id,
        test_type=test_config.get("testType", "custom"),
        subjects=test_config.get("subjects", []),
        total_questions=test_config.get("totalQuestions", 0),
        time_limit=test_config.get("timeLimit", DEFAULT_TIME_LIMIT),
        questions=test_config.get("questions", []),
    )
    db.session.add(test)
    db.session.commit()
    return jsonify({"testId": test.id}), 201


@question_bp.route("/api/test-history", methods=["POST"])
def get_test_history():
    user_id = (request.get_json(force=True) or {}).get("userId")
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400
    tests = db.session.query(TestPlan).filter(TestPlan.user_id == user_id).order_by(TestPlan.created_at.desc()).all()
    return jsonify({"tests": [{
        "testId": test.id,
        "testType": test.test_type,
        "subjects": test.subjects or [],
        "totalQuestions": test.total_questions,
        "timeLimit": test.time_limit,
        "questions": test.questions or [],
        "createdAt": test.created_at.isoformat() if test.created_at else datetime.now(timezone.utc).isoformat(),
        "score": None,
        "total": None,
        "percentage": None,
        "completedAt": None,
    } for test in tests]}), 200


@question_bp.route("/api/subjects", methods=["GET"])
def get_subjects():
    subjects = [row[0] for row in db.session.query(Question.subject).filter(Question.subject.isnot(None)).distinct().all()]
    return jsonify({"subjects": sorted(set(subjects))}), 200


@question_bp.route("/api/evaluate", methods=["POST"])
def evaluate():
    request_data = request.get_json(force=True) or {}
    questions = request_data.get("questions", [])
    user_answers = request_data.get("userAnswers", [])

    if not questions or not user_answers or len(questions) != len(user_answers):
        return jsonify({"error": "Invalid input"}), 400

    score = 0
    detailed_results = []
    for question, user_answer in zip(questions, user_answers):
        correct_answer = str(question.get("answer", "")).strip().upper()
        user_answer = str(user_answer).strip().upper() if user_answer else ""
        is_correct = correct_answer == user_answer
        score += 1 if is_correct else 0
        detailed_results.append({
            "question": question.get("question"),
            "correct_answer": correct_answer,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "subject": question.get("subject", "Unknown"),
            "topic": question.get("topic", "General"),
        })

    return jsonify({
        "total": len(questions),
        "score": score,
        "percentage": round((score / len(questions)) * 100, 2),
        "details": detailed_results,
    }), 200


@question_bp.route("/api/stats", methods=["GET"])
def get_stats():
    subject_counts = {
        subject: count
        for subject, count in db.session.query(Question.subject, func.count(Question.id)).group_by(Question.subject).all()
        if subject
    }
    total_associations = db.session.query(func.count(QuestionImageAssociation.id)).scalar() or 0
    return jsonify({
        "total_questions": db.session.query(func.count(Question.id)).scalar() or 0,
        "total_images": db.session.query(func.count(ImageAsset.id)).scalar() or 0,
        "total_associations": total_associations,
        "subject_distribution": subject_counts,
        "questions_with_images": total_associations,
    }), 200


@question_bp.route("/api/rag-info", methods=["GET"])
def get_rag_info():
    return jsonify({
        "rag_system": {
            "name": "Weighted RAG Pipeline for JEE Question Generation",
            "version": "3.0",
        },
        "question_sources": {
            "primary": "PostgreSQL + extracted PDF question bank",
            "secondary": "FAISS semantic retrieval",
        },
        "how_rag_works": {
            "step_1": "Process PDFs and extract questions/images",
            "step_2": "Store metadata in PostgreSQL",
            "step_3": "Embed question text and build FAISS index",
            "step_4": "Retrieve semantically relevant candidates",
            "step_5": "Boost weak topics using user analytics",
            "step_6": "Generate or normalize MCQs",
            "step_7": "Validate structure, subject, and image relevance",
        },
    }), 200

