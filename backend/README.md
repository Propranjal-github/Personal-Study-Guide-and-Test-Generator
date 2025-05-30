
# JEE Question Generator API

This Flask API processes PDF documents containing JEE study materials to extract images and generate
multiple-choice questions.

## Setup and Deployment

### Local Development

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set your GROQ API key as an environment variable:
   ```
   export GROQ_API_KEY=your_groq_api_key
   ```

3. Run the Flask app:
   ```
   python app.py
   ```

### Docker Deployment

1. Build the Docker image:
   ```
   docker build -t jee-question-generator .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 -e GROQ_API_KEY=your_groq_api_key jee-question-generator
   ```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/upload-pdf` - Upload and process a PDF file
- `POST /api/generate-questions` - Generate questions based on subject and count
- `GET /api/subjects` - Get list of available subjects

## Deployment Options

This API can be deployed to various cloud platforms:

- Heroku
- Railway
- Google Cloud Run
- AWS Elastic Beanstalk
