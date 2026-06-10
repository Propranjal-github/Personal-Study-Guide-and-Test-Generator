
import json
import re
import time
from typing import Dict, Optional

print("LOADING generation")

import requests
from sklearn.metrics.pairwise import cosine_similarity

from config import GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, MIN_QUESTION_SIMILARITY
from rag.validation import (
    normalize_text,
    is_valid_question_text,
    is_meaningful_option,
    normalize_correct_answer,
)
from rag.embeddings import get_faiss_store

CONTROL_CHARS_RE = re.compile(r'[\x00-\x1F\x7F]')
CODE_FENCE_RE = re.compile(r'^\s*```(?:json)?\s*|\s*```\s*$', re.IGNORECASE | re.DOTALL)

def clean_question_for_prompt(text):
    text = str(text or "")
    text = text.replace("\\(", "").replace("\\)", "")
    text = text.replace("\\[", "").replace("\\]", "")
    text = text.replace("\\frac", "fraction")
    text = text.replace("\\text", "")
    text = text.replace("\\lambda", "lambda").replace("\\alpha", "alpha")
    text = text.replace("\\beta", "beta").replace("\\pi", "pi")
    text = text.replace("\\theta", "theta").replace("\\cdot", "*")
    text = text.replace("\\times", "x")
    text = text.replace("\\", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:240]

def strip_code_fences(text):
    if not isinstance(text, str):
        return ""
    return CODE_FENCE_RE.sub("", text).strip()

def extract_message_content(response):
    try:
        payload = response.json()
    except ValueError:
        print("Response body is not JSON")
        print("Raw:", response.text[:300])
        return None
    try:
        choices = payload.get("choices", [])
        if not choices:
            print("No choices in response")
            return None
        content = (choices[0].get("message") or {}).get("content", "")
    except Exception as e:
        print("Failed to extract content:", e)
        return None
    if not isinstance(content, str) or not content.strip():
        print("Empty or invalid response content")
        return None
    return content

def repair_json_candidate(text):
    text = strip_code_fences(text)
    text = CONTROL_CHARS_RE.sub(" ", text)
    text = text.replace("\r", " ").replace("\t", " ")
    text = re.sub(r"\s+", " ", text).strip()
    start = text.find("{")
    if start == -1:
        return None
    end = text.rfind("}")
    if end == -1 or end < start:
        candidate = text[start:]
    else:
        candidate = text[start:end + 1]
    candidate = candidate.strip()
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)
    candidate = candidate.replace("\\", "\\\\")
    if candidate.count('"') % 2 != 0:
        candidate += '"'
    open_braces = candidate.count("{")
    close_braces = candidate.count("}")
    if close_braces < open_braces:
        candidate += "}" * (open_braces - close_braces)
    return candidate

def parse_mcq_content(content):
    candidate = repair_json_candidate(content)
    if not candidate:
        print("No JSON found in response")
        print("Raw:", content[:300])
        return None
    try:
        return json.loads(candidate)
    except json.JSONDecodeError as e:
        print("JSON decode error:", e)
        print("Raw:", candidate[:300])
        return None

def generate_enhanced_mcq(question_record: Dict, allow_llm: bool = True) -> Optional[Dict]:
    """
    If the question already has 4 good options, reuse them.
    Otherwise use Groq to convert it into MCQ.
    """
    try:
        raw_question = question_record.get("question_text") or question_record.get("text") or question_record.get("raw_text", "")
        clean_question = clean_question_for_prompt(raw_question)

        if not clean_question:
            print("Empty question skipped")
            return None

        existing_options = question_record.get("options") or []
        existing_answer = question_record.get("answer_letter") or question_record.get("correct_answer") or ""

        if len(existing_options) == 4 and all(is_meaningful_option(o) for o in existing_options) and existing_answer:
            letter, answer_text = normalize_correct_answer(existing_answer, existing_options)
            if letter:
                return {
                    "question": normalize_text(question_record.get("text") or raw_question),
                    "options": [normalize_text(o) for o in existing_options],
                    "correct_answer": letter,
                    "correct_answer_text": answer_text,
                    "solution": normalize_text(question_record.get("solution") or ""),
                    "source": "extracted",
                }

        if not allow_llm or not GROQ_API_KEY:
            print("LLM disabled or API key missing")
            return None

        prompt = f"""
You are converting ONE valid subject-specific question into a clean MCQ.

Source question:
{clean_question}

STRICT RULES:
- Use only the source question.
- Do NOT create paper-pattern, instructions, marks, section-count, or meta questions.
- Do NOT mix another subject.
- Do NOT use LaTeX.
- Do NOT use markdown.
- Do NOT use backslashes in values.
- Create exactly 4 options.
- All 4 options must be meaningful, plausible, and clearly different.
- Options must not be random numbers only.
- Output must be valid JSON only.
- Keep solution short, 1 sentence max.

Return exactly this JSON shape:
{{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correct_answer": "A",
  "solution": "..."
}}
"""
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        data = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
        }

        response = None
        for attempt in range(4):
            try:
                response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=(10, 60))
            except requests.exceptions.RequestException as e:
                wait = min(30, 2 ** attempt)
                print(f"Network error: {e}")
                time.sleep(wait)
                continue

            if response.status_code == 200:
                break

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                try:
                    wait = float(retry_after) if retry_after else min(30, 5 * (attempt + 1))
                except ValueError:
                    wait = min(30, 5 * (attempt + 1))
                print(f"Rate limit, waiting {wait}s")
                time.sleep(wait)
                continue

            print("GROQ API error:", response.status_code, response.text[:500])
            return None
        else:
            return None

        content = extract_message_content(response)
        if content is None:
            return None

        mcq = parse_mcq_content(content)
        if not mcq or not isinstance(mcq, dict):
            print("Parsed payload invalid")
            return None

        question = normalize_text(mcq.get("question", ""))
        options = mcq.get("options", [])
        solution = normalize_text(mcq.get("solution", ""))

        if not is_valid_question_text(question):
            print("Invalid or meta question")
            return None
        if not isinstance(options, list) or len(options) != 4:
            print("Invalid options count")
            return None
        if len({normalize_text(o).lower() for o in options}) != 4:
            print("Duplicate options found")
            return None
        if not all(is_meaningful_option(opt) for opt in options):
            print("Options are not meaningful, using source options")
            source_options = question_record.get("options") or []
            if len(source_options) == 4:
                options = [normalize_text(o) for o in source_options]
            else:
                options = [
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D",
                ]

        options = [normalize_text(opt) for opt in options]
        correct_letter, correct_text = normalize_correct_answer(mcq.get("correct_answer"), options)
        if not correct_letter:
            print("Could not normalize correct answer")
            print("Raw answer:", mcq.get("correct_answer"))
            return None

        # semantic drift check
        # try:
        #     source_vec = get_faiss_store().embed_texts([clean_question])
        #     gen_vec = get_faiss_store().embed_texts([question])
        #     qsim = cosine_similarity(source_vec, gen_vec)[0][0]
        #     if qsim < MIN_QUESTION_SIMILARITY:
        #         print("Generated question too far from source")
        #         return None
        # except Exception:
        #     pass

        return {
            "question": question,
            "options": options,
            "correct_answer": correct_letter,
            "correct_answer_text": correct_text,
            "solution": solution[:250],
            "source": "groq",
        }

    except Exception as e:
        print("Error generating MCQ:", str(e))
        return None
