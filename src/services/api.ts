
import axios from 'axios';

// Set this to your deployed API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Question {
  question: string;
  caption: string;
  image_data?: string; // Base64 encoded image
  subject: string;
}

export const uploadPDF = async (file: File): Promise<{
  message: string;
  extracted_items: number;
  pdf_name: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const generateQuestions = async (
  subject: string = 'All',
  count: number = 10
): Promise<{
  questions: Question[];
  subject: string;
  count: number;
}> => {
  const response = await api.post('/generate-questions', {
    subject,
    count,
  });
  
  return response.data;
};

export const getSubjects = async (): Promise<{
  subjects: string[];
}> => {
  const response = await api.get('/subjects');
  return response.data;
};
