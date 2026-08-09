# 🧠 AI-Powered JEE Test Generator using RAG & LLMs

> **An AI-driven platform for generating personalized JEE-style mock tests from educational PDFs using Retrieval-Augmented Generation (RAG), semantic search, and Large Language Models.**

This project addresses one of the biggest challenges in competitive exam preparation: **creating high-quality, curriculum-aligned practice tests at scale**. Instead of relying on manually curated question banks, the system transforms educational material into an intelligent knowledge base and automatically generates exam-style questions grounded in trusted source content.

---

## 🚀 Motivation

Creating JEE mock tests is a time-intensive process that requires balancing **topic coverage, question difficulty, and syllabus alignment**. Generic LLMs can generate questions, but they often hallucinate or drift away from the source material.

This project combines **Retrieval-Augmented Generation (RAG)** with **semantic similarity search** to ensure that generated questions remain faithful to uploaded educational resources while supporting personalized and adaptive test creation.

---

## ✨ Core Features

### 📄 Intelligent PDF Knowledge Extraction

* Extracts text and educational diagrams from uploaded PDFs using **PyMuPDF**.
* Associates figures with surrounding contextual information to build meaningful image-caption pairs.

### 🤖 AI-Powered Question Generation

* Generates original JEE-style multiple-choice questions using **LLaMA-3 (via Groq API)**.
* Grounds generation in retrieved educational content to reduce hallucinations and improve relevance.

### 🔍 Retrieval-Augmented Generation (RAG)

* Converts extracted content into semantic embeddings using **Sentence-BERT**.
* Indexes **1,200+ educational knowledge chunks** using **FAISS** for efficient vector similarity search.
* Retrieves the most relevant context before generation, enabling curriculum-aligned outputs.

### 🎯 Personalized Mock Test Creation

* Generate topic-wise or customized practice tests based on selected educational material.
* Supports targeted preparation by focusing on specific chapters and weak areas.

### ⚡ Semantic Evaluation & Instant Feedback

* Automatically evaluates completed tests and stores results for future analysis.
* Uses semantic similarity scoring to compare generated content against authentic JEE-style patterns.

### 📊 Modern Learning Dashboard

* Interactive dashboard and test interface built with **React + Tailwind CSS**.
* Test history, result tracking, and retry functionality for continuous learning.

---

## 🏗️ System Architecture

```text
                     ┌───────────────────────┐
                     │    Educational PDFs   │
                     └──────────┬────────────┘
                                │
                         PDF Parsing (PyMuPDF)
                                │
                                ▼
                  Text & Image Caption Extraction
                                │
                                ▼
                   Semantic Chunk Generation
                                │
                Sentence-BERT Embedding Model
                                │
                                ▼
                  FAISS Vector Index (RAG)
                                │
          User Query / Topic / Personalized Request
                                │
                                ▼
                  Top-k Semantic Retrieval
                                │
                                ▼
                LLaMA-3 Question Generation
                                │
                                ▼
           Personalized JEE Mock Test + Evaluation
```

---

## 💡 Why This Approach?

### 🔹 Retrieval over Hallucination

Instead of asking an LLM to generate questions directly, the model first retrieves the most relevant educational content using vector search. This significantly improves topic relevance and curriculum alignment.

### 🔹 Semantic Understanding

Traditional keyword-based search struggles with paraphrased educational content. **Sentence-BERT embeddings** capture conceptual similarity, enabling robust retrieval even when wording differs.

### 🔹 Fast Vector Search

**FAISS** enables low-latency nearest-neighbor retrieval over thousands of embedded question chunks, making the pipeline scalable and responsive.

### 🔹 Research-Oriented Design

The architecture follows modern **Context Engineering** principles where retrieval quality and context management are treated as first-class components of the AI pipeline.

---

## 🛠️ Technology Stack

| Layer                   | Technologies                         |
| ----------------------- | ------------------------------------ |
| **Frontend**            | React.js, Tailwind CSS               |
| **Backend**             | Flask (Python), REST APIs            |
| **Authentication**      | Firebase Authentication              |
| **Database**            | PostgreSQL                           |
| **Document Processing** | PyMuPDF                              |
| **LLM**                 | Groq API (LLaMA-3)                   |
| **Embeddings**          | Sentence-BERT                        |
| **Vector Search**       | FAISS                                |
| **AI Paradigm**         | Retrieval-Augmented Generation (RAG) |

---

## 🔬 AI Pipeline

1. User uploads educational PDFs.
2. The backend extracts text and educational figures.
3. Content is cleaned and divided into semantic chunks.
4. Sentence-BERT converts chunks into dense vector embeddings.
5. Embeddings are indexed using FAISS.
6. When a user requests a test, the query is embedded and the **top-k most relevant chunks** are retrieved.
7. Retrieved context is supplied to LLaMA-3 through a RAG pipeline.
8. The model generates curriculum-aligned JEE-style questions.
9. Completed tests are automatically evaluated and stored for future analysis.

---

## 📈 Key Capabilities

* ✅ AI-assisted JEE-style MCQ generation
* ✅ Retrieval-Augmented Generation (RAG)
* ✅ Semantic vector search using FAISS
* ✅ Personalized and topic-wise test generation
* ✅ Automatic evaluation and result history
* ✅ Interactive dashboard and modern UI
* ✅ Modular architecture extensible to NEET, AIIMS, UPSC, and other examination domains

---

## 🌟 Future Enhancements

* Adaptive difficulty control based on student performance.
* Weak-topic detection and personalized revision plans.
* Multi-document retrieval and hybrid (BM25 + Vector) search.
* Fine-tuned educational language models for domain-specific generation.
* Analytics dashboard with learning insights and progress visualization.

---

## 📚 Research Impact

This project served as the foundation for the research paper:

**"A Generative AI-Based Platform for Personalized Test Creation and Learning Insights"**

🏆 **Best Paper Award — IEEE ICDSINC 2025**

The work explores how Retrieval-Augmented Generation and semantic retrieval techniques can improve the reliability, personalization, and educational quality of AI-assisted assessment systems.

---

## ⚙️ Getting Started

### Clone the Repository

```bash
git clone https://github.com/Propranjal-github/Personal-Study-Guide-and-Test-Generator.git
cd Personal-Study-Guide-and-Test-Generator
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file and add the required API keys and database configuration.

```env
GROQ_API_KEY=your_api_key
DATABASE_URL=your_postgresql_url
FIREBASE_CONFIG=your_firebase_config
```

### Run the Backend

```bash
python app.py
```

### Run the Frontend

```bash
npm install
npm run dev
```

---

## 🤝 Contributing

Contributions, feature suggestions, and discussions are always welcome. Feel free to fork the repository, open issues, or submit pull requests.

---

## 📄 License

This project is intended for educational and research purposes.
