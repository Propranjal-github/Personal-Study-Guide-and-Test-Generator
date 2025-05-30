// src/pages/Results.tsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Question {
  question: string;
  options: string[];
  answer: string;
  caption?: string;
  image_path?: string;
  subject?: string;
}

interface LocationState {
  questions: Question[];
  userAnswers: string[];
}

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, userAnswers } = location.state as LocationState;

  if (!questions || !userAnswers) {
    return <div className="text-red-500 p-4">No data to display.</div>;
  }

  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (q.answer === userAnswers[idx] ? 1 : 0);
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mock Test Results</h1>
      <p className="mb-6 text-lg">Score: {correctCount}/{questions.length}</p>

      {questions.map((q, index) => {
        const isCorrect = q.answer === userAnswers[index];
        return (
          <div key={index} className="border rounded p-4 mb-4 bg-white shadow">
            <p className="font-semibold">{index + 1}. {q.question}</p>
            {q.image_path && (
              <img src={`data:image/png;base64,${q.image_path}`} alt="related visual" className="my-2 max-h-64" />
            )}
            <div className="mt-2 space-y-1">
              {q.options.map((opt, i) => (
                <div key={i} className={`px-3 py-1 rounded border ${opt === q.answer ? 'border-green-600' : opt === userAnswers[index] ? 'border-red-500' : 'border-gray-300'}`}>
                  {opt}
                </div>
              ))}
            </div>
            <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              Your answer: <strong>{userAnswers[index]}</strong> {isCorrect ? '(Correct)' : `(Correct: ${q.answer})`}
            </p>
          </div>
        );
      })}

      <button
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => navigate('/customtest')}
      >
        Retake Test
      </button>
    </div>
  );
};

export default Results;
