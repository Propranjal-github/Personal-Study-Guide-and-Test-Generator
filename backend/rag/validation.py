
import re
from typing import List, Dict, Optional

META_PATTERNS = [
    r"maximum marks", r"question paper", r"paper pattern", r"structure of the question paper",
    r"how many questions", r"answered out of", r"marking scheme", r"total marks",
    r"section\s+[a-z0-9]+", r"instructions?", r"choose the correct option for free expansion",
    r"number of questions", r"part\s+[ivx]+", r"all questions are compulsory",
    r"question diagram", r"statement i and statement ii", r"strict rules"
]

SUBJECT_KEYWORDS = {
    "Physics": [
        r"\bphysics\b", r"\bforce\b", r"\bvelocity\b", r"\bacceleration\b", r"\bcurrent\b",
        r"\bvoltage\b", r"\bresistance\b", r"\boptics?\b", r"\bmechanics?\b", r"\bthermodynamics?\b",
        r"\bwave(s)?\b", r"\belectric\b", r"\bmagnetic\b", r"\bphotoelectric\b"
    ],
    "Chemistry": [
        r"\bchemistry\b", r"\breaction(s)?\b", r"\bacid(s)?\b", r"\bbase(s)?\b", r"\bsalt(s)?\b",
        r"\bcompound(s)?\b", r"\bmole(s)?\b", r"\borganic\b", r"\binorganic\b", r"\bperiodic\b",
        r"\boxidation\b", r"\breduction\b", r"\bboxidation\b", r"\baldehyde\b", r"\bketone\b"
    ],
    "Mathematics": [
        r"\bmathematics\b", r"\balgebra\b", r"\bgeometry\b", r"\bcalculus\b", r"\bintegral(s)?\b",
        r"\bderivative(s)?\b", r"\bprobability\b", r"\btrigonometry\b", r"\bsequence(s)?\b", r"\bvector(s)?\b"
    ],
    "Biology": [
        r"\bbiology\b", r"\bcell(s)?\b", r"\bgenetic(s)?\b", r"\bplant(s)?\b", r"\banimal(s)?\b",
        r"\bphotosynthesis\b", r"\bhuman body\b", r"\brespiration\b"
    ]
}

def normalize_text(text) -> str:
    text = str(text or "")
    text = re.sub(r"[\uE000-\uF8FF]", " ", text)  # weird PDF glyphs
    text = text.replace("\uf028", " ").replace("\uf05b", " ").replace("\uf05d", " ")
    text = text.replace("\\", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def clean_pdf_text(text) -> str:
    return normalize_text(text)

def is_meta_question(text: str) -> bool:
    t = normalize_text(text).lower()
    return any(re.search(pat, t, re.IGNORECASE) for pat in META_PATTERNS)

def subject_score_map(text: str) -> Dict[str, int]:
    low = normalize_text(text).lower()
    scores = {}
    for subject, patterns in SUBJECT_KEYWORDS.items():
        scores[subject] = sum(1 for pat in patterns if re.search(pat, low, re.IGNORECASE))
    return scores

def detect_subject_from_text(text: str, fallback: Optional[str] = None) -> Optional[str]:
    scores = subject_score_map(text)
    best_subject = None
    best_score = 0
    for subject, score in scores.items():
        if score > best_score:
            best_subject = subject
            best_score = score

    if best_score == 0:
        return fallback

    sorted_scores = sorted(scores.values(), reverse=True)
    second_best = sorted_scores[1] if len(sorted_scores) > 1 else 0
    if best_score <= second_best:
        return fallback

    return best_subject or fallback

def extract_question_number(text: str) -> Optional[int]:
    t = normalize_text(text)
    patterns = [
        r'^\s*(?:Q(?:uestion)?\s*)?(\d{1,4})\s*[\.\)\-:]\s*',
        r'^\s*\(?(\d{1,4})\)?\s*[\.\)\-:]\s*',
    ]
    for pat in patterns:
        m = re.match(pat, t, re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                continue
    return None

def is_valid_question_text(text: str) -> bool:
    t = normalize_text(text)
    if len(t) < 35:
        return False
    if any(word in t.lower() for word in ["maximum marks", "question paper", "structure", "how many questions", "section", "instructions", "total marks", "answered out of"]):
        return False
    if len(re.findall(r"[A-Za-z]", t)) < 15:
        return False
    if t.count("=") > 8:
        return False
    return True

def is_meaningful_option(opt: str) -> bool:
    t = normalize_text(opt)
    if len(t) < 3:
        return False
    if re.fullmatch(r"[\d\s\-\+\*/=().,^%]+", t):
        return False
    if len(re.findall(r"[A-Za-z]", t)) < 2:
        return False
    return True

def image_relevance_score(question_text: str, caption: str, surrounding_text: str = "") -> int:
    def token_set(text):
        words = re.findall(r"[a-zA-Z0-9]+", normalize_text(text).lower())
        return {w for w in words if len(w) > 2}
    q = token_set(question_text)
    c = token_set(caption)
    s = token_set(surrounding_text)
    return len(q & (c | s))

def parse_options_from_block(block: str) -> List[str]:
    text = normalize_text(block)
    # Try to capture A/B/C/D options
    patterns = {
        "A": r'(?:^|\n)\s*A[\.\)\-:]\s*(.*?)(?=(?:\n\s*B[\.\)\-:]|\Z))',
        "B": r'(?:^|\n)\s*B[\.\)\-:]\s*(.*?)(?=(?:\n\s*C[\.\)\-:]|\Z))',
        "C": r'(?:^|\n)\s*C[\.\)\-:]\s*(.*?)(?=(?:\n\s*D[\.\)\-:]|\Z))',
        "D": r'(?:^|\n)\s*D[\.\)\-:]\s*(.*?)(?=(?:\n\s*(?:Answer|Ans|Correct)[\.\)\-:]|\Z))',
    }
    options = []
    for key in ["A", "B", "C", "D"]:
        m = re.search(patterns[key], text, flags=re.IGNORECASE | re.DOTALL)
        if m:
            opt = normalize_text(m.group(1))
            options.append(opt)
        else:
            options.append("")
    if all(options):
        return options
    return []

def normalize_correct_answer(correct_answer, options):
    if not options or len(options) != 4:
        return None, None

    raw = normalize_text(correct_answer).upper()

    m = re.match(r'^\s*([ABCD])\s*[\)\.\-:]?\s*$', raw, flags=re.IGNORECASE)
    if m:
        letter = m.group(1).upper()
        idx = ord(letter) - 65
        return letter, options[idx] if 0 <= idx < 4 else None

    m = re.match(r'^\s*([ABCD])\s*[\)\.\-:]\s*(.+)$', raw, flags=re.IGNORECASE)
    if m:
        letter = m.group(1).upper()
        idx = ord(letter) - 65
        return letter, options[idx] if 0 <= idx < 4 else normalize_text(m.group(2))

    raw_norm = normalize_text(raw).lower()
    for i, opt in enumerate(options):
        opt_norm = normalize_text(opt).lower()
        if raw_norm == opt_norm or raw_norm in opt_norm or opt_norm in raw_norm:
            return chr(65 + i), opt

    return None, raw
