# 📝 Personal Study Guide and Test Generator

An intelligent web platform that **creates JEE-style mock tests** from your study PDFs! 🚀  
Upload your academic material, extract questions, attempt timed tests, and get **instant evaluation** — all powered by **AI and semantic search**.

---

## ✨ Key Features

- **PDF Parsing & Image Captioning**: Extract text and images from PDFs using **PyMuPDF**, captions diagrams with nearby text.  
- **AI-Generated MCQs**: Generates original JEE-style questions from image-caption pairs using **Groq's LLaMA-3**.  
- **Semantic Similarity**: Compares generated questions with real JEE questions using **Sentence-BERT** for high-quality test generation.  
- **Fast Vector Search**: Stores embeddings in **FAISS** for instant semantic retrieval and evaluation.  
- **Custom Test Creation**: Users can generate personalized mock tests and curate question sets.  
- **Automatic Evaluation & History**: Auto-evaluation of tests and storing results in **MongoDB**.  
- **Modern, Interactive Frontend**: Dashboard, test interface, and retry option built with **React + Tailwind CSS**.  

---

## 💡 Why It’s Effective

- **AI-Driven Question Generation**: Automatically creates high-quality, JEE-style questions from PDFs and diagrams, saving hours of manual work.  
- **Semantic Similarity Scoring**: Ensures generated questions match the difficulty and style of real JEE questions using **Sentence-BERT**.  
- **Personalized Tests**: Students can take tests based on weak topics, enhancing targeted learning.  
- **Instant Evaluation**: Auto-evaluates tests and provides immediate feedback to reinforce learning.  
- **Scalable & Reusable**: The AI pipeline can be extended to other exams like NEET, AIIMS, or even school assessments.  
- **Interactive UI**: A clean, responsive dashboard makes test-taking smooth, motivating, and engaging.  
 

---

## 🛠 Tech Stack

| Frontend           | Backend         | AI / ML & NLP                                                                 | Storage  |
| ------------------ | --------------- | ---------------------------------------------------------------------------- | -------- |
| React + Tailwind CSS | Flask (Python) | Groq API (LLaMA-3) <br> PyMuPDF (PDF parsing & captions) <br> Sentence-BERT (semantic similarity) <br> FAISS (vector storage) | MongoDB  |

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Propranjal-github/Personal-Study-Guide-and-Test-Generator.git
cd Personal-Study-Guide-and-Test-Generator
