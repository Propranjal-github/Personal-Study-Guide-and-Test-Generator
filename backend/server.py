from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
import os
import time
import numpy as np
import faiss
import uuid
from datetime import datetime, timezone
import base64
from io import BytesIO
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage
import requests
import re
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
import pandas as pd
import json
import re
import time
import requests

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

mongo_uri = os.getenv('MONGODB_URI')
mongo_client = MongoClient(mongo_uri)
db = mongo_client['jeeAce']
tests_collection = db['tests']

pdf_folder = "./pdfs"
output_dir = "./pdf_images"
os.makedirs(output_dir, exist_ok=True)
os.makedirs(pdf_folder, exist_ok=True)

embedder = SentenceTransformer('all-MiniLM-L6-v2')

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

question_faiss_index = faiss.IndexFlatL2(384)
image_faiss_index = faiss.IndexFlatL2(384)

questions_data = [] 
images_data = []
question_image_associations = []  

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    pdf_path = os.path.join(pdf_folder, file.filename)
    file.save(pdf_path)
    
    extracted_questions, extracted_images, associations = extract_pdf_data_enhanced(pdf_path, output_dir)
    
    store_enhanced_data_to_faiss(extracted_questions, extracted_images, associations)
    
    return jsonify({
        "message": "PDF processed successfully",
        "questions_extracted": len(extracted_questions),
        "images_extracted": len(extracted_images),
        "associations_found": len(associations),
        "pdf_name": file.filename
    }), 200


@app.route('/api/generate-questions', methods=['POST'])
def generate_questions_api():
    try:
        subject = request.json.get('subject', 'All')
        count = min(int(request.json.get('count', 10)), 25)
        topics = request.json.get('topics', [])
        topic_filter = topics[0] if topics else None

        print(f"Generating {count} questions for subject: {subject}")
        print(f"Total questions in database: {len(questions_data)}")

        # 🔍 Get relevant questions
        if topic_filter:
            relevant_questions = retrieve_relevant_questions(topic_filter, subject, count * 2)
        else:
            relevant_questions = filter_questions_by_subject(subject, count * 2)

        relevant_questions = [
            q for q in relevant_questions
            if is_valid_question_text(q.get("text", ""))
            and (subject == "All" or q.get("subject") == subject)
        ]

        print(f"Found {len(relevant_questions)} relevant questions")

        generated_questions = []

        for i, question_data in enumerate(relevant_questions):
            if len(generated_questions) >= count:
                break

            print(f"Processing question {i+1}/{len(relevant_questions)}")

            # ⏳ avoid rate limit
            if i > 0:
                time.sleep(3)

            # 🔥 Generate MCQ
            mcq = generate_enhanced_mcq(question_data)

            if not mcq:
                print("❌ Skipped (generation failed)")
                continue

            # ✅ Validate MCQ
            if not mcq.get("question") or len(mcq.get("options", [])) != 4:
                print("❌ Invalid MCQ format")
                continue

            # 🧠 Build response object
            question_obj = {
                "question": mcq["question"],
                "options": mcq["options"],
                "answer": mcq["correct_answer"],  # ✅ FIXED KEY
                "subject": question_data.get("subject", "Unknown"),
                "source_text": question_data.get("text", "")[:200] + "...",
                "page": question_data.get("page"),
                "pdf_source": question_data.get("source_pdf")
            }

            # 🖼️ Attach image if available
            associated_image = find_associated_image(question_data['id'])

            if associated_image:
                img_score = image_relevance_score(
                    question_data.get("text", ""),
                    associated_image.get("caption", ""),
                    associated_image.get("surrounding_text", "")
                )
                if img_score < 1:
                    associated_image = None

            if associated_image and os.path.exists(associated_image.get("image_path", "")):
                try:
                    with open(associated_image["image_path"], "rb") as img_file:
                        img_data = base64.b64encode(img_file.read()).decode('utf-8')
                        question_obj["image_data"] = f"data:image/jpeg;base64,{img_data}"
                        question_obj["image_caption"] = associated_image.get("caption", "")
                except Exception as e:
                    print(f"⚠️ Image error: {e}")

            generated_questions.append(question_obj)
            print(f"✅ Generated {len(generated_questions)} questions")

        print(f"🔥 Final count: {len(generated_questions)}")

        return jsonify({
            "questions": generated_questions,
            "subject": subject,
            "count": len(generated_questions),
            "total_questions_in_db": len(questions_data),
            "total_images_in_db": len(images_data)
        }), 200

    except Exception as e:
        print(f"❌ Error in generate_questions_api: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/save-test', methods=['POST'])
def save_test():
    data = request.json
    user_id = data.get('userId')
    test_config = data.get('testConfig')
    
    if not user_id or not test_config:
        return jsonify({"error": "Missing userId or testConfig"}), 400

    test_data = {
        "userId": user_id,
        "testType": test_config.get("testType"),
        "subjects": test_config.get("subjects"),
        "totalQuestions": test_config.get("totalQuestions"),
        "timeLimit": test_config.get("timeLimit"),
        "questions": test_config.get("questions"),
    
"createdAt": datetime.now(timezone.utc),
    }

    result = tests_collection.insert_one(test_data)
    return jsonify({"testId": str(result.inserted_id)}), 201

@app.route('/api/save-test-result', methods=['POST'])
def save_test_result():
    try:
        data = request.json
        print(f"Received test result data: {data}")
        
      
        required_fields = ['userId', 'testId', 'results']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400

        test_result = {
            "userId": data.get('userId'),
            "userEmail": data.get('userEmail'),
            "testId": data.get('testId'),
            "testName": data.get('testName', 'Unnamed Test'),
            "testType": data.get('testType', 'custom'),
            "subjects": data.get('subjects', []),
            "totalQuestions": data.get('totalQuestions', 0),
            "results": {
                "score": data.get('results', {}).get('score', 0),
                "total": data.get('results', {}).get('total', 0),
                "percentage": data.get('results', {}).get('percentage', 0),
                "details": data.get('results', {}).get('details', []),
                "subjectWiseResults": data.get('results', {}).get('subjectWiseResults', {})
            },
            "timeTaken": data.get('timeTaken', 0),
            "timeLimit": data.get('timeLimit', 0),
            "completedAt": data.get('completedAt'),
            "createdAt": data.get('createdAt', datetime.now(timezone.utc).isoformat())
        }

        result = db.test_results.insert_one(test_result)
        
        print(f"Test result saved with ID: {result.inserted_id}")
        
        return jsonify({
            "message": "Test result saved successfully",
            "resultId": str(result.inserted_id)
        }), 200
        
    except Exception as e:
        print(f"Error saving test result: {str(e)}")
        return jsonify({"error": f"Failed to save test result: {str(e)}"}), 500
@app.route('/api/test-history', methods=['POST'])
def get_test_history():
    user_id = request.json.get('userId')
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    tests = tests_collection.find({"userId": user_id}).sort("createdAt", -1)
    test_list = [
        {
            "testId": str(test["_id"]),
            "testType": test["testType"],
            "subjects": test["subjects"],
            "totalQuestions": test["totalQuestions"],
            "timeLimit": test["timeLimit"],
            "questions": test["questions"], 
            "createdAt": test["createdAt"].isoformat(),
            "score": test.get("score"),
            "total": test.get("total"),
            "percentage": test.get("percentage"),
            "completedAt": test.get("completedAt", None).isoformat() if test.get("completedAt") else None,
        }
        for test in tests
    ]
    return jsonify({"tests": test_list}), 200

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    subjects = set()
    for item in questions_data:
        if item.get("subject"):
            subjects.add(item["subject"])
    
    return jsonify({
        "subjects": list(subjects)
    }), 200

def extract_pdf_data_enhanced(pdf_path, output_dir):
    doc = fitz.open(pdf_path)
    filename = os.path.basename(pdf_path)

    extracted_questions = []
    extracted_images = []
    associations = []

    current_subject = None

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        lower_text = text.lower()

        page_subject = detect_subject_from_text(text, current_subject)
        if page_subject:
            current_subject = page_subject

        questions_on_page = extract_questions_from_text(
            text, page_num, filename, current_subject or "All"
        )
        extracted_questions.extend(questions_on_page)

        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            image_filename = f"{filename}_p{page_num+1}_img{img_index+1}.{image_ext}"
            image_path = os.path.join(output_dir, image_filename)

            with open(image_path, "wb") as f:
                f.write(image_bytes)

            img_rect = fitz.Rect(img[1:5])
            nearby_text = normalize_text(extract_text_near_image(page, img_rect, distance_threshold=100))

            # Skip weak / generic images
            if len(nearby_text) < 10:
                continue

            image_data = {
                "id": str(uuid.uuid4()),
                "image_path": image_path,
                "page": page_num + 1,
                "source_pdf": filename,
                "subject": current_subject or "Unknown",
                "position": {
                    "x": img_rect.x0,
                    "y": img_rect.y0,
                    "width": img_rect.width,
                    "height": img_rect.height
                },
                "caption": nearby_text,
                "surrounding_text": text
            }

            extracted_images.append(image_data)

            for question in questions_on_page:
                q_text = question.get("text", "")
                q_subject = question.get("subject", current_subject)

                if not is_valid_question_text(q_text):
                    continue

                # same subject only
                if current_subject and q_subject and q_subject != current_subject:
                    continue

                similarity_score = calculate_text_similarity(q_text, nearby_text)
                overlap_score = image_relevance_score(q_text, nearby_text, text)

                # stricter association rule
                if similarity_score >= MIN_IMAGE_SIMILARITY and overlap_score >= 1:
                    associations.append({
                        "question_id": question["id"],
                        "image_id": image_data["id"],
                        "similarity_score": similarity_score,
                        "caption_overlap": overlap_score,
                        "question_page": question["page"],
                        "image_page": image_data["page"],
                        "question_subject": q_subject,
                        "image_subject": image_data["subject"],
                        "association_type": "semantic_strict"
                    })

    doc.close()
    return extracted_questions, extracted_images, associations

def extract_questions_from_text(text, page_num, filename, subject):
    questions = []
    seen = set()

    question_patterns = [
        r'(\d+\.\s+.*?(?=\d+\.\s+|\n\n|\Z))',
        r'(Q\d+\.\s+.*?(?=Q\d+\.\s+|\n\n|\Z))',
        r'(\(\d+\)\s+.*?(?=\(\d+\)|\n\n|\Z))',
        r'(Example\s+\d+.*?(?=Example\s+\d+|\n\n|\Z))',
        r'([A-Z][^.]{20,400}\?)'
    ]

    for i, pattern in enumerate(question_patterns):
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            candidate = normalize_text(match)
            if candidate in seen:
                continue
            seen.add(candidate)

            if not is_valid_question_text(candidate):
                continue

            q_subject = detect_subject_from_text(candidate, subject)

            # Strict subject lock: if subject is known and question looks like another subject, skip it
            if subject != "All" and q_subject and q_subject != subject:
                continue

            questions.append({
                "id": str(uuid.uuid4()),
                "text": candidate,
                "page": page_num + 1,
                "source_pdf": filename,
                "subject": q_subject or subject or "Unknown",
                "extraction_pattern": i,
                "word_count": len(candidate.split())
            })

    return questions

def extract_text_near_image(page, img_rect, distance_threshold=100):
    words = page.get_text("words")
    nearby_words = []
    
    for word in words:
        word_rect = fitz.Rect(word[:4])
        
        distance = min(
            abs(word_rect.x0 - img_rect.x1), 
            abs(word_rect.x1 - img_rect.x0), 
            abs(word_rect.y0 - img_rect.y1), 
            abs(word_rect.y1 - img_rect.y0)  
        )
        
        if distance <= distance_threshold:
            nearby_words.append(word[4])  
    
    return " ".join(nearby_words)

def calculate_text_similarity(text1, text2):
    if not text1 or not text2:
        return 0.0
    
    try:
        embeddings = embedder.encode([text1, text2])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)
    except:
        return 0.0

def store_enhanced_data_to_faiss(questions, images, associations):
    global questions_data, images_data, question_image_associations
   
    if questions:
        question_embeddings = []
        for question in questions:
            embedding = embedder.encode(question["text"])
            question_embeddings.append(embedding)
            questions_data.append(question)
        
        if question_embeddings:
            embeddings_np = np.array(question_embeddings, dtype='float32')
            question_faiss_index.add(embeddings_np)
    
    if images:
        image_embeddings = []
        for image in images:
            text_to_embed = f"{image.get('caption', '')} {image.get('surrounding_text', '')[:500]}"
            embedding = embedder.encode(text_to_embed)
            image_embeddings.append(embedding)
            images_data.append(image)
        
        if image_embeddings:
            embeddings_np = np.array(image_embeddings, dtype='float32')
            image_faiss_index.add(embeddings_np)
    
    question_image_associations.extend(associations)


def retrieve_relevant_questions(query, subject, k=10):
    if not questions_data:
        return []

    query_embedding = embedder.encode([query])
    search_k = min(max(k * 4, 20), len(questions_data))

    distances, indices = question_faiss_index.search(
        query_embedding.astype('float32'),
        search_k
    )

    relevant_questions = []
    seen = set()

    for idx in indices[0]:
        if idx < 0 or idx >= len(questions_data):
            continue

        question = questions_data[idx]
        q_text = question.get("text", "")

        if not is_valid_question_text(q_text):
            continue

        if subject != 'All' and question.get('subject') != subject:
            continue

        norm = normalize_text(q_text).lower()
        if norm in seen:
            continue
        seen.add(norm)

        relevant_questions.append(question)
        if len(relevant_questions) >= k:
            break

    return relevant_questions

def filter_questions_by_subject(subject, k=10):
    filtered_questions = []
    seen = set()

    for question in questions_data:
        q_text = question.get("text", "")

        if not is_valid_question_text(q_text):
            continue

        if subject != 'All' and question.get('subject') != subject:
            continue

        norm = normalize_text(q_text).lower()
        if norm in seen:
            continue
        seen.add(norm)

        filtered_questions.append(question)
        if len(filtered_questions) >= k:
            break

    return filtered_questions



# =========================
# STRICT PIPELINE RULES
# Paste after find_associated_image() and before generate_enhanced_mcq()
# =========================

META_PATTERNS = [
    r"maximum marks", r"question paper", r"paper pattern", r"structure of the question paper",
    r"how many questions", r"answered out of", r"marking scheme", r"total marks",
    r"section\s+[a-z0-9]+", r"instructions?", r"choose the correct option for free expansion",
    r"number of questions", r"part\s+[ivx]+", r"all questions are compulsory"
]

SUBJECT_KEYWORDS = {
    "Physics": [
        r"\bphysics\b", r"\bforce\b", r"\bvelocity\b", r"\bacceleration\b", r"\bcurrent\b",
        r"\bvoltage\b", r"\bresistance\b", r"\boptics?\b", r"\bmechanics?\b", r"\bthermodynamics?\b",
        r"\bwave(s)?\b", r"\belectric\b", r"\bmagnetic\b"
    ],
    "Chemistry": [
        r"\bchemistry\b", r"\breaction(s)?\b", r"\bacid(s)?\b", r"\bbase(s)?\b", r"\bsalt(s)?\b",
        r"\bcompound(s)?\b", r"\bmole(s)?\b", r"\bor ganic\b", r"\binorganic\b", r"\bperiodic\b",
        r"\boxidation\b", r"\breduction\b"
    ],
    "Mathematics": [
        r"\bmathematics\b", r"\balgebra\b", r"\bgeometry\b", r"\bcalculus\b", r"\bintegral(s)?\b",
        r"\bderivative(s)?\b", r"\bprobability\b", r"\btrigonometry\b", r"\bsequence(s)?\b"
    ],
    "Biology": [
        r"\bbiology\b", r"\bcell(s)?\b", r"\bgenetic(s)?\b", r"\bplant(s)?\b", r"\banimal(s)?\b",
        r"\bphotosynthesis\b", r"\bhuman body\b", r"\brespiration\b"
    ]
}

MIN_QUESTION_LEN = 35
MIN_IMAGE_SIMILARITY = 0.58

def normalize_text(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()

def token_set(text):
    words = re.findall(r"[a-zA-Z0-9]+", normalize_text(text).lower())
    return {w for w in words if len(w) > 2}

def is_meta_question(text):
    t = normalize_text(text).lower()
    return any(re.search(pat, t, re.IGNORECASE) for pat in META_PATTERNS)

def subject_score_map(text):
    low = normalize_text(text).lower()
    scores = {}
    for subject, patterns in SUBJECT_KEYWORDS.items():
        score = 0
        for pat in patterns:
            if re.search(pat, low, re.IGNORECASE):
                score += 1
        scores[subject] = score
    return scores

def detect_subject_from_text(text, fallback=None):
    scores = subject_score_map(text)
    best_subject = None
    best_score = 0
    for subject, score in scores.items():
        if score > best_score:
            best_subject = subject
            best_score = score

    if best_score == 0:
        return fallback

    # If two subjects are too close, keep fallback instead of guessing.
    sorted_scores = sorted(scores.values(), reverse=True)
    second_best = sorted_scores[1] if len(sorted_scores) > 1 else 0
    if best_score <= second_best:
        return fallback

    return best_subject or fallback

def is_valid_question_text(text):
    t = normalize_text(text)
    if len(t) < MIN_QUESTION_LEN:
        return False
    if is_meta_question(t):
        return False
    # reject very broken fragments
    if t.count("(") > 6 and t.count(")") < 2:
        return False
    if t.count("=") > 10:
        return False
    return True

def image_relevance_score(question_text, caption, surrounding_text=""):
    q = token_set(question_text)
    c = token_set(caption)
    s = token_set(surrounding_text)
    overlap = len(q & (c | s))
    return overlap

def is_meaningful_option(opt):
    t = normalize_text(opt)
    if len(t) < 2:
        return False
    if is_meta_question(t):
        return False
    # reject pure symbol/noise options
    if re.fullmatch(r"[\d\s\-\+\*/=().,^%]+", t):
        return False
    return True

def find_associated_image(question_id):
    candidates = [
        a for a in question_image_associations
        if a.get("question_id") == question_id and a.get("similarity_score", 0) >= MIN_IMAGE_SIMILARITY
    ]
    if not candidates:
        return None

    best = max(
        candidates,
        key=lambda a: (
            a.get("similarity_score", 0),
            a.get("caption_overlap", 0),
        )
    )

    return next((img for img in images_data if img["id"] == best["image_id"]), None)


CONTROL_CHARS_RE = re.compile(r'[\x00-\x1F\x7F]')
CODE_FENCE_RE = re.compile(r'^\s*```(?:json)?\s*|\s*```\s*$', re.IGNORECASE | re.DOTALL)

def clean_question_for_prompt(text):
    text = str(text or "")
    # Remove LaTeX-ish wrappers and backslashes so the model stops echoing them into JSON
    text = text.replace("\\(", "")
    text = text.replace("\\)", "")
    text = text.replace("\\[", "")
    text = text.replace("\\]", "")
    text = text.replace("\\frac", "fraction")
    text = text.replace("\\text", "")
    text = text.replace("\\lambda", "lambda")
    text = text.replace("\\alpha", "alpha")
    text = text.replace("\\beta", "beta")
    text = text.replace("\\pi", "pi")
    text = text.replace("\\theta", "theta")
    text = text.replace("\\cdot", "·")
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
        print("❌ Response body is not JSON")
        print("Raw:", response.text[:300])
        return None

    try:
        choices = payload.get("choices", [])
        if not choices:
            print("❌ No choices in response")
            return None
        content = (choices[0].get("message") or {}).get("content", "")
    except Exception as e:
        print("❌ Failed to extract content:", e)
        return None

    if not isinstance(content, str) or not content.strip():
        print("❌ Empty or invalid response content")
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

    # Remove trailing commas before } or ]
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)

    # Make all backslashes literal so LaTeX-like content stops breaking JSON
    candidate = candidate.replace("\\", "\\\\")

    # If quotes are unbalanced, try a simple recovery
    if candidate.count('"') % 2 != 0:
        candidate += '"'

    # If braces are unbalanced, close them
    open_braces = candidate.count("{")
    close_braces = candidate.count("}")
    if close_braces < open_braces:
        candidate += "}" * (open_braces - close_braces)

    return candidate

def parse_mcq_content(content):
    candidate = repair_json_candidate(content)
    if not candidate:
        print("❌ No JSON found in response")
        print("Raw:", content[:300])
        return None

    try:
        return json.loads(candidate)
    except json.JSONDecodeError as e:
        print("❌ JSON decode error:", e)
        print("Raw:", candidate[:300])
        return None

def normalize_correct_answer(correct_answer, options):
    if not options or len(options) != 4:
        return None, None

    raw = str(correct_answer).strip()

    # A / B / C / D
    m = re.match(r'^\s*([ABCD])\s*[\)\.\-:]?\s*$', raw, flags=re.IGNORECASE)
    if m:
        letter = m.group(1).upper()
        idx = ord(letter) - 65
        return letter, options[idx] if 0 <= idx < 4 else None

    # A) text / B. text
    m = re.match(r'^\s*([ABCD])\s*[\)\.\-:]\s*(.+)$', raw, flags=re.IGNORECASE)
    if m:
        letter = m.group(1).upper()
        idx = ord(letter) - 65
        return letter, options[idx] if 0 <= idx < 4 else m.group(2).strip()

    # Match by text
    raw_norm = re.sub(r"\s+", " ", raw).strip().lower()
    for i, opt in enumerate(options):
        opt_norm = re.sub(r"\s+", " ", str(opt)).strip().lower()
        if raw_norm == opt_norm or raw_norm in opt_norm or opt_norm in raw_norm:
            return chr(65 + i), opt

    return None, raw

def generate_enhanced_mcq(question_data):
    try:
        raw_question = question_data.get("question") or question_data.get("text", "")
        clean_question = clean_question_for_prompt(raw_question)

        if not clean_question:
            print("❌ Empty question skipped")
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
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }

        response = None

        # Retries for rate limit + network failures
        for attempt in range(4):
            try:
                response = requests.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=data,
                    timeout=(10, 60)
                )
            except requests.exceptions.RequestException as e:
                wait = min(30, 2 ** attempt)
                print(f"❌ Network error: {e}")
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

                print(f"⏳ Rate limit, waiting {wait}s")
                time.sleep(wait)
                continue

            print("❌ GROQ API error:", response.status_code, response.text[:500])
            return None
        else:
            return None

        content = extract_message_content(response)
        if content is None:
            return None

        mcq = parse_mcq_content(content)
        if not mcq or not isinstance(mcq, dict):
            print("❌ Parsed payload invalid")
            return None

        # 🔥 ADD THIS BLOCK HERE
        if not is_valid_question_text(mcq.get("question", "")):
            print("❌ Invalid or meta question")
            return None

        if not isinstance(mcq.get("options", []), list) or len(mcq["options"]) != 4:
            print("❌ Invalid options count")
            return None

        if len({normalize_text(o).lower() for o in mcq["options"]}) != 4:
            print("❌ Duplicate options found")
            return None

        if not all(is_meaningful_option(opt) for opt in mcq["options"]):
            print("❌ Options are not meaningful")
            return None
        # 🔥 END BLOCK

        question = str(mcq.get("question", "")).strip()
        options = mcq.get("options", [])
        solution = str(mcq.get("solution", "")).strip()

        if not question:
            print("❌ Missing question text")
            return None

        if not isinstance(options, list) or len(options) != 4:
            print("❌ Invalid options count")
            return None

        options = [str(opt).strip() for opt in options]

        correct_letter, correct_text = normalize_correct_answer(mcq.get("correct_answer"), options)
        if not correct_letter:
            print("❌ Could not normalize correct answer")
            print("Raw answer:", mcq.get("correct_answer"))
            return None

        return {
            "question": question,
            "options": options,
            "correct_answer": correct_letter,
            "correct_answer_text": correct_text,
            "solution": solution[:250]
        }
    except Exception as e: 
        print("❌ Error generating MCQ:", str(e)) 
        return None

def parse_mcq_string(mcq_str):
    try:
        # Extract question
        q_match = re.search(r'Q:\s*(.*?)(?=\n\s*A\.|\nA\.)', mcq_str, re.DOTALL)
        question = q_match.group(1).strip() if q_match else ""

        # Extract options
        options = []
        option_patterns = [
            r'A\.\s*(.*?)(?=\n\s*B\.|\nB\.)',
            r'B\.\s*(.*?)(?=\n\s*C\.|\nC\.)',
            r'C\.\s*(.*?)(?=\n\s*D\.|\nD\.)',
            r'D\.\s*(.*?)(?=\n\s*Answer:|\nAnswer:)'
        ]
        
        for pattern in option_patterns:
            match = re.search(pattern, mcq_str, re.DOTALL)
            if match:
                option_text = match.group(1).strip().split('\n')[0].strip()
                options.append(option_text)
            else:
                options.append("")

        # Extract answer
        ans_match = re.search(r'Answer:\s*([ABCD])', mcq_str)
        answer = ans_match.group(1).strip() if ans_match else ""

        if not question or len(options) != 4 or not answer or any(not opt for opt in options):
            return None

        return {
            "question": question,
            "options": options,
            "answer": answer
        }
    except Exception as e:
        print(f"Error parsing MCQ string: {e}")
        return None
    

@app.route('/api/user-test-results/<user_id>', methods=['GET'])
def get_user_test_results(user_id):
    try:
       
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        skip = (page - 1) * limit
     
        results = list(db.test_results.find(
            {"userId": user_id}
        ).sort("completedAt", -1).skip(skip).limit(limit))
        
        for result in results:
            result['_id'] = str(result['_id'])
       
            if 'completedAt' not in result or result['completedAt'] is None:
                result['completedAt'] = result.get('createdAt', datetime.now(timezone.utc))
            if 'timeTaken' not in result:
                result['timeTaken'] = 0
            if 'results' not in result:
                result['results'] = {'score': 0, 'total': 0, 'percentage': 0}
            if 'totalQuestions' not in result:
                result['totalQuestions'] = result.get('results', {}).get('total', 0)
       
        total_count = db.test_results.count_documents({"userId": user_id})
        
        return jsonify({
            "results": results,
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_results": total_count,
                "has_next": skip + limit < total_count,
                "has_prev": page > 1
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching user test results: {str(e)}")
        return jsonify({"error": f"Failed to fetch test results: {str(e)}"}), 500
@app.route('/api/user-stats/<user_id>', methods=['GET'])
def get_user_stats(user_id):
    try:
      
        pipeline = [
            {"$match": {"userId": user_id}},
            {"$group": {
                "_id": "$userId",
                "totalTests": {"$sum": 1},
                "averageScore": {"$avg": "$results.percentage"},
                "totalQuestions": {"$sum": "$totalQuestions"},
                "totalTimeTaken": {"$sum": "$timeTaken"},
                "bestScore": {"$max": "$results.percentage"},
                "recentTests": {"$push": {
                    "testName": "$testName",
                    "score": "$results.percentage",
                    "completedAt": "$completedAt",
                    "subjects": "$subjects"
                }}
            }}
        ]
        
        stats = list(db.test_results.aggregate(pipeline))
        
        if not stats:
            return jsonify({
                "totalTests": 0,
                "averageScore": 0,
                "totalQuestions": 0,
                "totalTimeTaken": 0,
                "bestScore": 0,
                "recentTests": [],
                "subjectPerformance": []
            }), 200
        
        user_stats = stats[0]
        
    
        user_stats["averageScore"] = user_stats.get("averageScore") or 0
        user_stats["bestScore"] = user_stats.get("bestScore") or 0
        user_stats["totalTimeTaken"] = user_stats.get("totalTimeTaken") or 0
        
        subject_pipeline = [
            {"$match": {"userId": user_id}},
            {"$unwind": "$subjects"},
            {"$group": {
                "_id": "$subjects",
                "averageScore": {"$avg": "$results.percentage"},
                "testCount": {"$sum": 1}
            }}
        ]
        
        subject_stats = list(db.test_results.aggregate(subject_pipeline))
        
        return jsonify({
            "totalTests": user_stats.get("totalTests", 0),
            "averageScore": round(user_stats.get("averageScore", 0), 2),
            "totalQuestions": user_stats.get("totalQuestions", 0),
            "totalTimeTaken": user_stats.get("totalTimeTaken", 0),
            "bestScore": round(user_stats.get("bestScore", 0), 2),
            "recentTests": user_stats.get("recentTests", [])[-5:], 
            "subjectPerformance": subject_stats
        }), 200
        
    except Exception as e:
        print(f"Error fetching user stats: {str(e)}")
        return jsonify({"error": f"Failed to fetch user stats: {str(e)}"}), 500

@app.route('/api/test-result/<result_id>', methods=['GET'])
def get_test_result_details(result_id):
    try:
        from bson.objectid import ObjectId
        
        result = db.test_results.find_one({"_id": ObjectId(result_id)})
        
        if not result:
            return jsonify({"error": "Test result not found"}), 404
        
        result['_id'] = str(result['_id'])
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error fetching test result details: {str(e)}")
        return jsonify({"error": f"Failed to fetch test result: {str(e)}"}), 500
@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    request_data = request.json
    questions = request_data.get("questions", [])
    user_answers = request_data.get("userAnswers", [])
    
    if not questions or not user_answers or len(questions) != len(user_answers):
        return jsonify({"error": "Invalid input"}), 400

    score = 0
    detailed_results = []

    for i, (q, ua) in enumerate(zip(questions, user_answers)):
        correct_answer = q.get("answer", "").strip().upper()
        user_answer = ua.strip().upper() if ua else ""
        is_correct = correct_answer == user_answer
        
        if is_correct:
            score += 1
            
        detailed_results.append({
            "question": q.get("question"),
            "correct_answer": correct_answer,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "subject": q.get("subject", "Unknown")
        })

    return jsonify({
        "total": len(questions),
        "score": score,
        "percentage": round((score / len(questions)) * 100, 2),
        "details": detailed_results
    }), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    subject_counts = {}
    for question in questions_data:
        subject = question.get('subject', 'Unknown')
        subject_counts[subject] = subject_counts.get(subject, 0) + 1
    
    return jsonify({
        "total_questions": len(questions_data),
        "total_images": len(images_data),
        "total_associations": len(question_image_associations),
        "subject_distribution": subject_counts,
        "questions_with_images": len([a for a in question_image_associations])
    }), 200

def process_all_pdfs_on_startup():
    print("Processing all existing PDFs in folder...")
    global questions_data, images_data, question_image_associations
    
    questions_data.clear()
    images_data.clear()
    question_image_associations.clear()
    
    for filename in os.listdir(pdf_folder):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder, filename)
            print(f"Processing {filename}...")
            try:
                extracted_questions, extracted_images, associations = extract_pdf_data_enhanced(pdf_path, output_dir)
                store_enhanced_data_to_faiss(extracted_questions, extracted_images, associations)
                print(f"  - Questions: {len(extracted_questions)}")
                print(f"  - Images: {len(extracted_images)}")
                print(f"  - Associations: {len(associations)}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    print(f"Finished processing PDFs. Total: {len(questions_data)} questions, {len(images_data)} images, {len(question_image_associations)} associations")

if __name__ == '__main__':
    process_all_pdfs_on_startup()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))