from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from analytics.weak_topics import generate_test_analysis, get_user_weak_topics_with_weights
from database.db import db
from database.models import TestResult, WeakTopic

analytics_bp = Blueprint("analytics_routes", __name__)


@analytics_bp.route("/api/save-test-result", methods=["POST"])
def save_test_result():
    try:
        data = request.get_json(force=True) or {}
        for field in ["userId", "testId", "results"]:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        completed_at = data.get("completedAt")
        completed_dt = None
        if completed_at:
            try:
                completed_dt = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
            except Exception:
                completed_dt = datetime.now(timezone.utc)

        result_row = TestResult(
            user_id=data.get("userId"),
            user_email=data.get("userEmail"),
            test_id=data.get("testId"),
            test_name=data.get("testName", "Unnamed Test"),
            test_type=data.get("testType", "custom"),
            subjects=data.get("subjects", []),
            total_questions=data.get("totalQuestions", 0),
            results={
                "score": data.get("results", {}).get("score", 0),
                "total": data.get("results", {}).get("total", 0),
                "percentage": data.get("results", {}).get("percentage", 0),
                "details": data.get("results", {}).get("details", []),
                "subjectWiseResults": data.get("results", {}).get("subjectWiseResults", {}),
            },
            time_taken=data.get("timeTaken", 0),
            time_limit=data.get("timeLimit", 0),
            completed_at=completed_dt,
        )
        db.session.add(result_row)
        db.session.commit()

        analysis = generate_test_analysis({
            "results": result_row.results,
            "totalQuestions": result_row.total_questions,
            "timeTaken": result_row.time_taken,
        })
        _upsert_weak_topics(data.get("userId"), analysis)
        return jsonify({
            "message": "Test result saved successfully",
            "resultId": result_row.id,
            "analysis": analysis,
        }), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to save test result: {str(exc)}"}), 500


@analytics_bp.route("/api/user-test-results/<user_id>", methods=["GET"])
def get_user_test_results(user_id):
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        skip = (page - 1) * limit

        query = db.session.query(TestResult).filter(TestResult.user_id == user_id).order_by(
            TestResult.completed_at.desc().nullslast(),
            TestResult.created_at.desc(),
        )
        total_count = query.count()
        results = query.offset(skip).limit(limit).all()

        return jsonify({
            "results": [_serialize_result(result) for result in results],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit if limit else 1,
                "total_results": total_count,
                "has_next": skip + limit < total_count,
                "has_prev": page > 1,
            },
        }), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch test results: {str(exc)}"}), 500


@analytics_bp.route("/api/user-stats/<user_id>", methods=["GET"])
def get_user_stats(user_id):
    try:
        results = db.session.query(TestResult).filter(TestResult.user_id == user_id).order_by(TestResult.created_at.asc()).all()
        if not results:
            return jsonify({
                "totalTests": 0,
                "averageScore": 0,
                "totalQuestions": 0,
                "totalTimeTaken": 0,
                "bestScore": 0,
                "recentTests": [],
                "subjectPerformance": [],
                "weakTopics": [],
                "improvementSuggestions": [],
                "performanceTrend": "insufficient_data",
            }), 200

        scores = [float((result.results or {}).get("percentage", 0)) for result in results]
        weak_topics_weights = get_user_weak_topics_with_weights(db.session, user_id)
        weak_topics = list(weak_topics_weights.keys())
        suggestions = [f"Focus on {topic} (weight: {weight:.2f})" for topic, weight in list(weak_topics_weights.items())[:3]]

        return jsonify({
            "totalTests": len(results),
            "averageScore": round(sum(scores) / len(scores), 2) if scores else 0,
            "totalQuestions": sum(result.total_questions or 0 for result in results),
            "totalTimeTaken": sum(result.time_taken or 0 for result in results),
            "bestScore": round(max(scores), 2) if scores else 0,
            "recentTests": [{
                "testName": result.test_name or "",
                "score": float((result.results or {}).get("percentage", 0)),
                "completedAt": result.completed_at.isoformat() if result.completed_at else "",
                "subjects": result.subjects or [],
                "testId": result.test_id or "",
            } for result in results[-5:]],
            "subjectPerformance": _subject_performance(results),
            "weakTopics": weak_topics,
            "weakTopicsWeights": weak_topics_weights,
            "improvementSuggestions": suggestions or ["Continue with balanced practice across all subjects"],
            "performanceTrend": "stable",
        }), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch user stats: {str(exc)}"}), 500


@analytics_bp.route("/api/get-test-recommendations", methods=["POST"])
def get_test_recommendations():
    try:
        user_id = (request.get_json(force=True) or {}).get("userId")
        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        weak_topics_weights = get_user_weak_topics_with_weights(db.session, user_id)
        weak_topics = list(weak_topics_weights.keys())
        return jsonify({
            "weak_topics": weak_topics,
            "weak_topics_weights": weak_topics_weights,
            "performance_trend": "stable",
            "suggested_focus": [f"Focus on {topic} (weight: {weak_topics_weights[topic]:.2f})" for topic in weak_topics[:3]]
            or ["Great job! Continue with balanced practice across all subjects"],
            "recommended_test_config": {
                "subjects": _subjects_for_topics(weak_topics) or ["Physics", "Chemistry", "Mathematics"],
                "difficulty": "medium",
                "question_count": 25,
                "focus_areas": weak_topics,
            },
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@analytics_bp.route("/api/test-analysis/<result_id>", methods=["GET"])
def get_test_analysis(result_id):
    result = db.session.get(TestResult, result_id)
    if not result:
        return jsonify({"error": "Test result not found"}), 404
    analysis = generate_test_analysis({
        "results": result.results or {},
        "totalQuestions": result.total_questions or 0,
        "timeTaken": result.time_taken or 0,
    })
    return jsonify({"analysis": analysis}), 200


@analytics_bp.route("/api/test-result/<result_id>", methods=["GET"])
def get_test_result_details(result_id):
    result = db.session.get(TestResult, result_id)
    if not result:
        return jsonify({"error": "Test result not found"}), 404
    return jsonify(_serialize_result(result)), 200


@analytics_bp.route("/api/test-results/<user_id>", methods=["GET"])
def get_test_results(user_id):
    results = db.session.query(TestResult).filter(TestResult.user_id == user_id).order_by(TestResult.created_at.desc()).all()
    return jsonify({
        "results": [_serialize_result(result) for result in results],
        "count": len(results),
        "userId": user_id,
    }), 200


def _serialize_result(result):
    return {
        "_id": result.id,
        "id": result.id,
        "userId": result.user_id,
        "userEmail": result.user_email,
        "testId": result.test_id,
        "testName": result.test_name,
        "testType": result.test_type,
        "subjects": result.subjects or [],
        "totalQuestions": result.total_questions,
        "results": result.results or {"score": 0, "total": 0, "percentage": 0},
        "timeTaken": result.time_taken or 0,
        "timeLimit": result.time_limit or 0,
        "completedAt": result.completed_at.isoformat() if result.completed_at else None,
        "createdAt": result.created_at.isoformat() if result.created_at else None,
    }


def _subject_performance(results):
    subject_stats = {}
    for result in results:
        for subject, data in (result.results or {}).get("subjectWiseResults", {}).items():
            subject_stats.setdefault(subject, {"total_correct": 0, "total_questions": 0, "test_count": 0})
            subject_stats[subject]["total_correct"] += data.get("correct", 0)
            subject_stats[subject]["total_questions"] += data.get("total", 0)
            subject_stats[subject]["test_count"] += 1

    output = []
    for subject, stats in subject_stats.items():
        if stats["total_questions"] > 0:
            output.append({
                "_id": subject,
                "averageScore": round((stats["total_correct"] / stats["total_questions"]) * 100, 2),
                "testCount": stats["test_count"],
            })
    return output


def _subjects_for_topics(topics):
    subjects = []
    for topic in topics:
        lower = topic.lower()
        if any(word in lower for word in ["physics", "mechanics", "thermodynamics", "electromagnetism", "optics", "waves"]):
            subjects.append("Physics")
        elif any(word in lower for word in ["chemistry", "organic", "inorganic", "atomic", "bonding"]):
            subjects.append("Chemistry")
        elif any(word in lower for word in ["mathematics", "calculus", "algebra", "trigonometry", "geometry", "probability", "complex"]):
            subjects.append("Mathematics")
    return sorted(set(subjects))


def _upsert_weak_topics(user_id, analysis):
    focus_areas = (analysis or {}).get("focus_areas", [])
    for area in focus_areas:
        topic = area.get("name")
        if not topic:
            continue
        weight = max(0.0, min(1.0, (85 - float(area.get("current_accuracy", 0))) / 85))
        existing = db.session.query(WeakTopic).filter(
            WeakTopic.user_id == user_id,
            WeakTopic.topic == topic,
        ).first()
        if existing:
            existing.weight = max(existing.weight or 0.0, weight)
            existing.subject = area.get("subject") or existing.subject
        else:
            db.session.add(WeakTopic(
                user_id=user_id,
                topic=topic,
                subject=area.get("subject"),
                weight=weight,
            ))
    db.session.commit()
