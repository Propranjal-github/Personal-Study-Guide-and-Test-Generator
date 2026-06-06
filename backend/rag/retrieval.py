print("LOADING retrieval")

from rag.validation import normalize_text, is_valid_question_text, detect_subject_from_text
from rag.embeddings import get_faiss_store
from database.models import Question

def _topic_similarity(topic1, topic2):
    if not topic1 or not topic2:
        return 0.0
    t1 = normalize_text(topic1).lower()
    t2 = normalize_text(topic2).lower()
    if t1 == t2:
        return 1.0
    if t1 in t2 or t2 in t1:
        return 0.8
    words1 = set(t1.split())
    words2 = set(t2.split())
    if not words1 or not words2:
        return 0.0
    common = words1 & words2
    if common:
        return min(0.7, len(common) / len(words1 | words2) * 1.2)
    synonyms = {
        "mechanics": ["motion", "force", "dynamics", "kinematics"],
        "thermodynamics": ["heat", "temperature", "entropy", "thermal"],
        "electromagnetism": ["electric", "magnetic", "current", "charge"],
        "optics": ["light", "reflection", "refraction", "lens"],
        "geometry": ["coordinate", "analytical", "spatial", "circle", "parabola"],
        "algebra": ["equation", "polynomial", "linear", "logarithm"],
        "calculus": ["derivative", "integral", "limit", "differential"],
        "organic chemistry": ["carbon", "hydrocarbon", "reaction", "ester", "alcohol"],
        "inorganic chemistry": ["salt", "ion", "periodic", "metal", "oxide"],
    }
    for key, syns in synonyms.items():
        if (key in t1 or any(s in t1 for s in syns)) and (key in t2 or any(s in t2 for s in syns)):
            return 0.6
    return 0.0

def filter_questions_by_subject(session, subject, k=10):
    query = session.query(Question).filter(Question.question_text.isnot(None))
    if subject and subject != "All":
        query = query.filter(Question.subject == subject)
    questions = query.order_by(Question.created_at.asc()).all()

    seen = set()
    out = []
    for q in questions:
        txt = q.question_text or ""
        if not is_valid_question_text(txt):
            continue
        norm = normalize_text(txt).lower()
        if norm in seen:
            continue
        seen.add(norm)
        out.append(q)
        if len(out) >= k:
            break
    return out

def retrieve_relevant_questions(session, query_text, subject, k=10, topic_filter=None, weak_topics_weights=None, difficulty=None):
    """
    Semantic retrieval using FAISS + optional weighted topic boosting.
    Returns SQLAlchemy Question objects sorted by final score.
    """
    weak_topics_weights = weak_topics_weights or {}

    # semantic candidates
    sem_results = get_faiss_store().search_questions(query_text or "", k=max(k * 5, 20))
    if not sem_results:
        return filter_questions_by_subject(session, subject, k)

    ids = [r["id"] for r in sem_results]
    questions = session.query(Question).filter(Question.id.in_(ids)).all()
    q_by_id = {q.id: q for q in questions}

    scored = []
    for r in sem_results:
        q = q_by_id.get(r["id"])
        if not q:
            continue
        if subject and subject != "All" and q.subject != subject:
            continue
        if not is_valid_question_text(q.question_text or ""):
            continue
        if topic_filter:
            q_topic = q.topic or detect_subject_from_text(q.question_text, q.subject)
            if _topic_similarity(topic_filter, q_topic) < 0.25:
                continue

        semantic_score = 1.0 / (1.0 + max(r["distance"], 0.0))
        topic_bonus = 0.0
        if weak_topics_weights:
            q_topic = q.topic or detect_subject_from_text(q.question_text, q.subject)
            for weak_topic, weight in weak_topics_weights.items():
                sim = _topic_similarity(q_topic, weak_topic)
                if sim > 0.25:
                    topic_bonus = max(topic_bonus, sim * float(weight))
        difficulty_bonus = 0.0
        if difficulty and q.difficulty and q.difficulty == difficulty:
            difficulty_bonus = 0.05

        final_score = semantic_score + topic_bonus + difficulty_bonus
        scored.append((final_score, q))

    scored.sort(key=lambda x: x[0], reverse=True)

    seen = set()
    out = []
    for score, q in scored:
        norm = normalize_text(q.question_text).lower()
        if norm in seen:
            continue
        seen.add(norm)
        out.append(q)
        if len(out) >= k:
            break

    if out:
        return out
    return filter_questions_by_subject(session, subject, k)

def topic_similarity(topic1, topic2):
    return _topic_similarity(topic1, topic2)
