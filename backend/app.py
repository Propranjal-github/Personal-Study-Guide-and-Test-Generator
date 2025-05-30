from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
import os
import numpy as np
import faiss
import uuid
import base64
from io import BytesIO
from sentence_transformers import SentenceTransformer
from PIL import Image as PILImage
import requests
import re

app = Flask(__name__)
CORS(app)

# === Paths ===
pdf_folder = "./pdfs"
output_dir = "./pdf_images"
os.makedirs(output_dir, exist_ok=True)
os.makedirs(pdf_folder, exist_ok=True)

# === Load embedding model ===
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# === Groq API Setup ===
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

# Initialize FAISS index
faiss_index = faiss.IndexFlatL2(384)
data = []

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
    
    # Extract data from the PDF
    extracted_data = extract_pdf_data(pdf_path, output_dir)
    
    # Store data into FAISS
    ids = store_data_to_faiss(extracted_data)
    
    return jsonify({
        "message": "PDF processed successfully",
        "extracted_items": len(extracted_data),
        "pdf_name": file.filename
    }), 200

@app.route('/api/generate-questions', methods=['POST'])
def generate_questions_api():
    subject = request.json.get('subject', 'All')
    count = min(int(request.json.get('count', 10)), 25)
    topics = request.json.get('topics', [])
    topic_filter = topics[0] if topics else None

    # Robust filtering logic from backend.py
    filtered_data = []
    for item in data:
        subj = item.get('subject')
        caption = item.get('caption', '')
        context_text = item.get('text', '')[:1000]
        if not subj or len(caption.strip()) < 30:
            continue
        if subject != 'All' and subj != subject:
            continue
        if topic_filter and topic_filter.lower() not in caption.lower() and topic_filter.lower() not in context_text.lower():
            continue
        filtered_data.append(item)

    print(f"[API] Filtered data count: {len(filtered_data)}")
    if filtered_data:
        print(f"[API] First item caption: {filtered_data[0].get('caption', '')[:60]}")
        print(f"[API] First item text: {filtered_data[0].get('text', '')[:60]}")

    if not filtered_data:
        return jsonify({"error": f"No data available for subject: {subject}"}), 404

    questions = []
    for item in filtered_data:
        if len(questions) >= count:
            break
        subj = item.get("subject")
        caption = item.get("caption", "")
        context_text = item.get("text", "")[:1000]
        raw_mcq = generate_question_from_caption(caption, subj)
        if not raw_mcq:
            continue
        rephrased_mcq = rephrase_question_with_context(raw_mcq, context_text)

        parsed_mcq = parse_mcq_string(rephrased_mcq)

        questions.append({
            "question": parsed_mcq["question"],
            "options": parsed_mcq["options"],
            "answer": parsed_mcq["answer"],
            "caption": caption,
            "image_path": item.get("image_path"),
            "subject": subj
        })

    # Convert image paths to base64 for API response
    for q in questions:
        if q.get("image_path") and os.path.exists(q["image_path"]):
            try:
                with open(q["image_path"], "rb") as img_file:
                    img_data = base64.b64encode(img_file.read()).decode('utf-8')
                    q["image_data"] = f"data:image/jpeg;base64,{img_data}"
                del q["image_path"]
            except Exception as e:
                q["error"] = f"Could not encode image: {str(e)}"

    return jsonify({
        "questions": questions,
        "subject": subject,
        "count": len(questions)
    }), 200

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    subjects = set()
    for item in data:
        if item.get("subject"):
            subjects.add(item["subject"])
    
    return jsonify({
        "subjects": list(subjects)
    }), 200

# === Helper Functions ===
def extract_pdf_data(pdf_path, output_dir):
    extracted_data = []
    doc = fitz.open(pdf_path)
    current_subject = None
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        lower_text = text.lower()
        
        if "physics" in lower_text:
            current_subject = "Physics"
        elif "chemistry" in lower_text:
            current_subject = "Chemistry"
        elif "math" in lower_text or "mathematics" in lower_text:
            current_subject = "Mathematics"
        
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            filename = os.path.basename(pdf_path)
            image_filename = f"{filename}_p{page_num+1}_img{img_index+1}.{image_ext}"
            image_path = os.path.join(output_dir, image_filename)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            
            words = page.get_text("words")
            caption = " ".join([w[4] for w in words if abs(w[1] - img[1]) < 100])
            
            if len(caption.strip()) > 30:
                item_data = {
                    "subject": current_subject,
                    "source_pdf": filename,
                    "page": page_num + 1,
                    "text": text,
                    "image_path": image_path,
                    "caption": caption
                }
                extracted_data.append(item_data)
                data.append(item_data)  # Add to global data
    
    return extracted_data

def store_data_to_faiss(extracted_data):
    ids = []
    embeddings = []
    
    for item in extracted_data:
        if item.get('subject'):
            embedding = embedder.encode(item["caption"])
            embeddings.append(embedding)
            ids.append(str(uuid.uuid4()))
    
    if embeddings:
        embeddings_np = np.array(embeddings, dtype='float32')
        if len(embeddings_np.shape) == 1:
            embeddings_np = embeddings_np.reshape(1, -1)
        faiss_index.add(embeddings_np)
    
    return ids

def generate_question_from_caption(caption, subject):
    prompt = f"""
You are an expert JEE {subject} tutor. Based on the following figure caption, generate one meaningful and original MCQ with 4 options and clearly state the correct answer.

Caption:
{caption}

Format:
Q: ...
A. ...
B. ...
C. ...
D. ...
Answer: ...
"""
    response = requests.post(
        GROQ_API_URL,
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': GROQ_MODEL,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.7,
            'max_tokens': 256
        }
    )
    
    try:
        response_data = response.json()
        if "choices" not in response_data or not response_data["choices"]:
            print(f"⚠️ No choices in response for caption: {caption[:50]}")
            return None
        return response_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def rephrase_question_with_context(question, context):
    prompt = f"""
The following is a multiple-choice question:

{question}

Based on the following context, rephrase the question only to better align it with the content, keeping the options and answer the same.

Context:
{context}
"""
    response = requests.post(
        GROQ_API_URL,
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': GROQ_MODEL,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.7,
            'max_tokens': 256
        }
    )
    
    try:
        response_data = response.json()
        if "choices" not in response_data or not response_data["choices"]:
            return question
        return response_data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"❌ Error during rephrasing: {e}")
        return question

def parse_mcq_string(mcq_str):
    # Extract question (after Q: and before A.)
    q_match = re.search(r'Q:\s*(.*?)\s*A\.', mcq_str, re.DOTALL)
    question = q_match.group(1).strip() if q_match else ""

    # Extract options A-D
    options = []
    for option_letter in ['A', 'B', 'C', 'D']:
        pattern = rf'{option_letter}\.\s*(.*)'
        match = re.search(pattern, mcq_str)
        if match:
            # Remove trailing newlines/spaces from option text
            option_text = match.group(1).strip().split('\n')[0]
            options.append(option_text)
    
    # Extract answer
    ans_match = re.search(r'Answer:\s*(.*)', mcq_str)
    answer = ans_match.group(1).strip() if ans_match else ""

    return {
        "question": question,
        "options": options,
        "answer": answer
    }

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    questions = data.get("questions", [])
    user_answers = data.get("userAnswers", [])
    
    if not questions or not user_answers or len(questions) != len(user_answers):
        return jsonify({"error": "Invalid input"}), 400

    score = 0
    detailed_results = []

    for q, ua in zip(questions, user_answers):
        correct = q.get("answer") == ua
        if correct:
            score += 1
        detailed_results.append({
            "question": q.get("question"),
            "correct_answer": q.get("answer"),
            "user_answer": ua,
            "is_correct": correct
        })

    return jsonify({
        "total": len(questions),
        "score": score,
        "details": detailed_results
    }), 200


def process_all_pdfs_on_startup():
    print("Processing all existing PDFs in folder...")
    global data
    data.clear()  # Clear any existing data
    for filename in os.listdir(pdf_folder):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder, filename)
            print(f"Processing {filename} ...")
            extracted_data = extract_pdf_data(pdf_path, output_dir)
            store_data_to_faiss(extracted_data)
    print(f"Finished processing PDFs on startup. Total items: {len(data)}")

if __name__ == '__main__':
    process_all_pdfs_on_startup()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
