from ingestion.pdf_processor import extract_answer_map


def link_answers_to_questions(questions, answer_text):
    answer_map = extract_answer_map(answer_text)
    for question in questions:
        question_number = question.get("question_number")
        if question_number in answer_map:
            question["answer_letter"] = answer_map[question_number]
            question["answer_text"] = answer_map[question_number]
    return questions


__all__ = ["extract_answer_map", "link_answers_to_questions"]

