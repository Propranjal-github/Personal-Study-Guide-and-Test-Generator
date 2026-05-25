from database.models import ImageAsset, QuestionImageAssociation
from rag.validation import image_relevance_score, normalize_text


def find_associated_image(session, question):
    assoc = (
        session.query(QuestionImageAssociation)
        .filter(QuestionImageAssociation.question_id == question.id)
        .order_by(
            QuestionImageAssociation.similarity_score.desc(),
            QuestionImageAssociation.caption_overlap.desc(),
        )
        .first()
    )
    if not assoc:
        return None

    image = session.get(ImageAsset, assoc.image_id)
    if not image or image.page != question.page or image.subject != question.subject:
        return None

    overlap = image_relevance_score(
        question.question_text,
        normalize_text(image.caption),
        normalize_text(image.surrounding_text),
    )
    if overlap < 2:
        return None

    return image


__all__ = ["find_associated_image"]

