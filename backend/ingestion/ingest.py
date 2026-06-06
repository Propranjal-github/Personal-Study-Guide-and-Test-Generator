
import hashlib
import json
from pathlib import Path

from config import PDF_DIR, IMAGE_DIR, STORAGE_DIR, PROCESSED_PDFS_PATH
from database.models import PDFDocument, Question, ImageAsset, QuestionImageAssociation
from ingestion.pdf_processor import process_pdf_file
from rag.embeddings import get_faiss_store

def calculate_file_hash(file_path):
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()

def load_processed_pdfs():
    if PROCESSED_PDFS_PATH.exists():
        try:
            return json.loads(PROCESSED_PDFS_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def save_processed_pdfs(data):
    PROCESSED_PDFS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROCESSED_PDFS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

def delete_existing_pdf_record(session, filename):
    existing = session.query(PDFDocument).filter(PDFDocument.filename == filename).first()
    if existing:
        session.delete(existing)
        session.commit()

def ingest_single_pdf(session, pdf_path):
    pdf_path = Path(pdf_path)
    filename = pdf_path.name
    file_hash = calculate_file_hash(pdf_path)

    # remove old version if changed
    existing = session.query(PDFDocument).filter(PDFDocument.filename == filename).first()
    if existing and existing.file_hash == file_hash:
        return {
            "filename": filename,
            "skipped": True,
            "reason": "unchanged",
            "questions": 0,
            "images": 0,
            "associations": 0,
        }

    if existing:
        session.delete(existing)
        session.commit()

    extracted_questions, extracted_images, associations = process_pdf_file(str(pdf_path), IMAGE_DIR)

    pdf_doc = PDFDocument(
        filename=filename,
        file_hash=file_hash,
        status="processed",
        total_questions=len(extracted_questions),
        total_images=len(extracted_images),
    )
    session.add(pdf_doc)
    session.flush()  # get pdf_doc.id

    question_id_map = {}
    for q in extracted_questions:
        qrec = Question(
            id=q["id"],
            pdf_id=pdf_doc.id,
            question_number=q.get("question_number"),
            raw_text=q.get("raw_text") or q.get("text") or "",
            question_text=q.get("text") or q.get("raw_text") or "",
            embedding_text=q.get("embedding_text") or q.get("text") or q.get("raw_text") or "",
            subject=q.get("subject"),
            topic=q.get("topic"),
            difficulty=q.get("difficulty", "medium"),
            page=q.get("page"),
            source_pdf=q.get("source_pdf", filename),
            options=q.get("options"),
            answer_letter=q.get("answer_letter"),
            answer_text=q.get("answer_text"),
            solution=q.get("solution"),
        )
        session.add(qrec)
        question_id_map[q["id"]] = qrec

    image_id_map = {}
    for img in extracted_images:
        irec = ImageAsset(
            id=img["id"],
            pdf_id=pdf_doc.id,
            image_path=img["image_path"],
            caption=img.get("caption"),
            surrounding_text=img.get("surrounding_text"),
            page=img.get("page"),
            subject=img.get("subject"),
            x=img.get("position", {}).get("x"),
            y=img.get("position", {}).get("y"),
            width=img.get("position", {}).get("width"),
            height=img.get("position", {}).get("height"),
        )
        session.add(irec)
        image_id_map[img["id"]] = irec

    session.flush()

    for assoc in associations:
        if assoc["question_id"] in question_id_map and assoc["image_id"] in image_id_map:
            session.add(QuestionImageAssociation(
                question_id=assoc["question_id"],
                image_id=assoc["image_id"],
                similarity_score=assoc.get("similarity_score", 0.0),
                caption_overlap=assoc.get("caption_overlap", 0),
                association_type=assoc.get("association_type", "semantic_strict"),
            ))

    session.commit()

    return {
        "filename": filename,
        "skipped": False,
        "questions": len(extracted_questions),
        "images": len(extracted_images),
        "associations": len(associations),
    }

def ingest_all_pdfs(session):
    processed = load_processed_pdfs()
    report = []
    pdf_files = [p for p in PDF_DIR.iterdir() if p.suffix.lower() == ".pdf"]

    for pdf_path in pdf_files:
        file_hash = calculate_file_hash(pdf_path)
        prev = processed.get(pdf_path.name)
        existing = session.query(PDFDocument).filter(
            PDFDocument.filename == pdf_path.name,
            PDFDocument.file_hash == file_hash,
        ).first()
        if prev and prev.get("hash") == file_hash and existing:
            report.append({"filename": pdf_path.name, "skipped": True, "reason": "unchanged"})
            continue

        result = ingest_single_pdf(session, pdf_path)
        report.append(result)
        processed[pdf_path.name] = {"hash": file_hash, "processed": True}

    save_processed_pdfs(processed)
    get_faiss_store().rebuild_from_db(
        session,
        Question,
        ImageAsset
    )    
    return report
