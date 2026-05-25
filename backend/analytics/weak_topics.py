
from collections import defaultdict
from datetime import datetime
from rag.validation import normalize_text

TOPIC_MAP = {
    "Physics": {
        "mechanics": ["force", "motion", "velocity", "acceleration", "momentum", "energy", "work", "friction", "gravity"],
        "thermodynamics": ["heat", "temperature", "entropy", "gas", "thermal", "pressure", "volume"],
        "electromagnetism": ["electric", "magnetic", "current", "voltage", "field", "charge", "capacitor", "inductor"],
        "optics": ["light", "lens", "mirror", "refraction", "reflection", "wave", "interference", "diffraction"],
        "modern physics": ["quantum", "atom", "nuclear", "photon", "electron", "radioactive", "relativity"],
        "waves": ["wave", "frequency", "amplitude", "wavelength", "sound", "vibration"],
    },
    "Chemistry": {
        "organic chemistry": ["carbon", "hydrocarbon", "alcohol", "acid", "ester", "benzene", "alkane", "alkene", "aldehyde"],
        "inorganic chemistry": ["metal", "salt", "oxide", "compound", "ion", "crystal", "periodic", "group"],
        "physical chemistry": ["equilibrium", "kinetics", "thermochemistry", "solution", "molarity", "ph", "buffer"],
        "atomic structure": ["electron", "proton", "neutron", "orbital", "shell", "configuration", "ionization"],
        "chemical bonding": ["bond", "ionic", "covalent", "molecular", "hybridization", "vsepr"],
    },
    "Mathematics": {
        "calculus": ["derivative", "integral", "limit", "differentiation", "integration", "maxima", "minima"],
        "algebra": ["equation", "polynomial", "matrix", "determinant", "logarithm", "exponential", "quadratic"],
        "trigonometry": ["sin", "cos", "tan", "angle", "triangle", "identity", "inverse"],
        "coordinate geometry": ["line", "circle", "parabola", "ellipse", "hyperbola", "slope", "distance"],
        "probability": ["probability", "statistics", "permutation", "combination", "distribution", "mean"],
        "complex numbers": ["complex", "imaginary", "modulus", "argument", "polar"],
    }
}

def extract_topic_from_text(text):
    if not text:
        return "General"
    text_lower = text.lower()
    all_topics = {}
    for subject_topics in TOPIC_MAP.values():
        all_topics.update(subject_topics)

    best_topic = "General"
    max_matches = 0
    for topic, keywords in all_topics.items():
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        if matches > max_matches:
            max_matches = matches
            best_topic = topic.title()
    return best_topic

def calculate_topic_similarity(topic1, topic2):
    if not topic1 or not topic2:
        return 0.0
    topic1_lower = normalize_text(topic1).lower().strip()
    topic2_lower = normalize_text(topic2).lower().strip()

    if topic1_lower == topic2_lower:
        return 1.0
    if topic1_lower in topic2_lower or topic2_lower in topic1_lower:
        return 0.8

    words1 = set(topic1_lower.split())
    words2 = set(topic2_lower.split())
    common_words = words1 & words2
    if common_words:
        total_words = len(words1 | words2)
        overlap_ratio = len(common_words) / total_words
        return min(0.7, overlap_ratio * 1.2)

    topic_synonyms = {
        'mechanics': ['motion', 'force', 'dynamics', 'kinematics'],
        'thermodynamics': ['heat', 'temperature', 'entropy', 'thermal'],
        'electromagnetism': ['electric', 'magnetic', 'electromagnetic', 'current'],
        'optics': ['light', 'reflection', 'refraction', 'lens'],
        'geometry': ['coordinate', 'analytical', 'geometric', 'spatial'],
        'algebra': ['algebraic', 'polynomial', 'equation', 'linear'],
        'calculus': ['derivative', 'integral', 'differential', 'limit'],
        'chemistry': ['chemical', 'reaction', 'molecular', 'atomic'],
        'organic': ['carbon', 'hydrocarbon', 'organic'],
        'inorganic': ['metal', 'salt', 'acid', 'base']
    }

    for main_topic, synonyms in topic_synonyms.items():
        if (main_topic in topic1_lower or any(syn in topic1_lower for syn in synonyms)) and \
           (main_topic in topic2_lower or any(syn in topic2_lower for syn in synonyms)):
            return 0.6
    return 0.0

def get_user_weak_topics_with_weights(session, user_id):
    """
    Analyze test history and return weighted weak topics.
    Works with results.details / subjectWiseResults if available.
    """
    weak_topics = {}
    topic_performance = defaultdict(lambda: {"correct": 0, "total": 0})

    from database.models import TestResult
    user_results = session.query(TestResult).filter(TestResult.user_id == user_id).order_by(TestResult.created_at.desc()).all()

    if not user_results:
        return {}

    for result in user_results:
        analysis_data = (result.results or {}).get("analysis", {})
        if analysis_data:
            focus_areas = analysis_data.get("focus_areas", [])
            for area in focus_areas:
                topic = area.get("name", "")
                current_acc = area.get("current_accuracy", 0)
                target_acc = area.get("target_accuracy", 100)
                priority = area.get("priority", "medium")
                accuracy_gap = target_acc - current_acc
                priority_multiplier = {"high": 3.0, "medium": 2.0, "low": 1.0}.get(priority, 1.0)
                weight = (accuracy_gap / 100) * priority_multiplier
                weak_topics[topic] = weak_topics.get(topic, 0) + weight

        details = (result.results or {}).get("details", [])
        for detail in details:
            question = detail.get("question", "")
            is_correct = detail.get("is_correct", True)
            topic = detail.get("topic") or extract_topic_from_text(question)
            topic_performance[topic]["total"] += 1
            if is_correct:
                topic_performance[topic]["correct"] += 1

    for topic, performance in topic_performance.items():
        if performance["total"] >= 2:
            accuracy = (performance["correct"] / performance["total"]) * 100
            if accuracy < 80:
                weight = (80 - accuracy) / 20
                weak_topics[topic] = weak_topics.get(topic, 0) + weight

    if weak_topics:
        max_weight = max(weak_topics.values())
        if max_weight > 0:
            for topic in weak_topics:
                weak_topics[topic] = weak_topics[topic] / max_weight

    sorted_topics = sorted(weak_topics.items(), key=lambda x: x[1], reverse=True)[:10]
    return dict(sorted_topics)

def generate_test_analysis(test_result):
    try:
        results = test_result.get("results", {})
        percentage = float(results.get("percentage", 0))
        total_questions = test_result.get("totalQuestions", 0) or 0
        time_taken = test_result.get("timeTaken", 0) or 0

        overall_performance = {
            "accuracy": percentage,
            "performance_grade": "Excellent" if percentage >= 85 else "Good" if percentage >= 70 else "Needs Improvement",
            "speed": time_taken / total_questions if total_questions > 0 else 0,
            "efficiency_score": round(percentage * 0.8 + 20, 1),
        }

        subject_analysis = {}
        subject_results = results.get("subjectWiseResults", {})
        for subject, data in subject_results.items():
            subject_analysis[subject] = {
                "accuracy": data.get("percentage", 0),
                "performance_level": "Excellent" if data.get("percentage", 0) >= 85 else "Good" if data.get("percentage", 0) >= 70 else "Needs Improvement",
                "efficiency": round(data.get("percentage", 0) * 0.8 + 20, 1),
                "average_time_per_question": time_taken / total_questions if total_questions > 0 else 0,
            }

        topic_analysis = {}
        question_details = results.get("details", [])
        focus_areas = []
        for question in question_details:
            topic = question.get("topic", question.get("subject", "Unknown"))
            if topic not in topic_analysis:
                topic_analysis[topic] = {
                    "questions_count": 0,
                    "correct_count": 0,
                    "accuracy": 0,
                    "needs_focus": False,
                }
            topic_analysis[topic]["questions_count"] += 1
            if question.get("is_correct", False):
                topic_analysis[topic]["correct_count"] += 1

        for topic, data in topic_analysis.items():
            if data["questions_count"] > 0:
                accuracy = (data["correct_count"] / data["questions_count"]) * 100
                data["accuracy"] = round(accuracy, 1)
                data["needs_focus"] = accuracy < 75
                if accuracy < 75:
                    priority = "high" if accuracy < 60 else "medium"
                    focus_areas.append({
                        "name": topic,
                        "current_accuracy": accuracy,
                        "target_accuracy": 85,
                        "priority": priority,
                        "questions_attempted": data["questions_count"],
                        "questions_correct": data["correct_count"],
                    })

        recommendations = []
        if percentage < 70:
            recommendations.append({
                "title": "Overall Performance Improvement",
                "description": "Focus on fundamental concepts and practice more questions",
                "category": "overall",
                "action_items": [
                    "Review basic concepts in weak subjects",
                    "Practice 20-30 questions daily",
                    "Take regular mock tests",
                    "Analyze mistakes thoroughly",
                ],
            })

        for area in focus_areas:
            if area["priority"] == "high":
                recommendations.append({
                    "title": f"Strengthen {area['name']}",
                    "description": f"Current accuracy: {area['current_accuracy']}%. Target: {area['target_accuracy']}%",
                    "category": "subject",
                    "action_items": [
                        f"Practice {area['name']} problems daily",
                        f"Review {area['name']} theory and formulas",
                        f"Solve previous year questions on {area['name']}",
                        f"Take topic-specific tests for {area['name']}",
                    ],
                })

        avg_time_per_question = time_taken / total_questions if total_questions > 0 else 0
        speed_analysis = {
            "average_time_per_question": avg_time_per_question,
            "time_management_score": min(100, max(0, 100 - (avg_time_per_question - 90) * 2)) if avg_time_per_question > 0 else 0,
            "speed_consistency": 85,
            "fastest_question_time": max(30, avg_time_per_question - 20),
            "slowest_question_time": avg_time_per_question + 30,
        }

        learning_insights = []
        if avg_time_per_question > 120:
            learning_insights.append({
                "type": "speed",
                "message": "Work on improving speed. Average time per question is above optimal.",
                "priority": "medium",
            })

        if percentage >= 85:
            learning_insights.append({
                "type": "performance",
                "message": "Excellent performance! Maintain this level and challenge yourself with harder questions.",
                "priority": "low",
            })
        elif percentage >= 70:
            learning_insights.append({
                "type": "performance",
                "message": "Good performance with room for improvement. Focus on weak areas.",
                "priority": "medium",
            })
        else:
            learning_insights.append({
                "type": "performance",
                "message": "Performance needs significant improvement. Focus on fundamentals.",
                "priority": "high",
            })

        return {
            "overall_performance": overall_performance,
            "subject_analysis": subject_analysis,
            "topic_analysis": topic_analysis,
            "focus_areas": focus_areas,
            "recommendations": recommendations,
            "speed_analysis": speed_analysis,
            "learning_insights": learning_insights,
            "strengths": [],
            "weaknesses": [{"description": area["name"], "severity": area["priority"], "metric": f"{area['current_accuracy']}% accuracy"} for area in focus_areas],
            "generated_at": datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"Error generating test analysis: {e}")
        return {}
