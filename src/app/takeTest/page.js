"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase-config"; 
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/navbar";

export default function TakeTest() {
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true); 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        router.push('/login'); 
        return;
      }
    });

    return () => unsubscribe();
  }, [router]);
  
  const handleSubmitTest = useCallback(async () => {
    if (!testData || !testData.questions || !user) {
      console.error("Test data or user not available");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: testData.questions,
          userAnswers: testData.questions.map((_, index) => userAnswers[index] || ""),
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);

        try {
          const testResultData = {
            userId: user.uid,
            userEmail: user.email,
            testId: testData.testId || `test_${Date.now()}`,
            testName: testData.testName || 'Custom Test',
            testType: testData.testType || 'custom',
            subjects: testData.subjects || [],
            totalQuestions: testData.questions.length,
            results: {
              score: results.score,
              total: results.total,
              percentage: ((results.score / results.total) * 100).toFixed(1),
              details: results.details,
            },
            timeTaken: (testData.timeLimit * 60) - timeLeft,
            timeLimit: testData.timeLimit * 60,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          await fetch('http://localhost:5000/api/save-test-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify(testResultData),
          });
        } catch (saveError) {
          console.error('Could not save test result:', saveError);
        }
      } else {
        throw new Error('Failed to evaluate test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
    } finally {
      setIsLoading(false);
      setTestCompleted(true);
    }
  }, [testData, userAnswers, timeLeft, user]);

  useEffect(() => {
    if (!authLoading && user) {
      try {
        const storedTest = localStorage.getItem('currentTest');
        if (storedTest) {
          const parsedTest = JSON.parse(storedTest);
          
          if (!parsedTest.questions || parsedTest.questions.length === 0) {
            alert('Error: Test has no questions. Please create a new test.');
            router.push('/mockTests');
            return;
          }
          
          setTestData(parsedTest);
          setTimeLeft(parsedTest.timeLimit * 60);
        } else {
          router.push('/mockTests');
        }
      } catch (error) {
        console.error('Error loading test data:', error);
        alert('Error loading test data. Please create a new test.');
        router.push('/mockTests');
      }
    }
  }, [router, authLoading, user]);

  useEffect(() => {
    if (timeLeft > 0 && !testCompleted && testData) {
      if (timeLeft === 300) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
      
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !testCompleted && testData) {
      handleSubmitTest();
    }
  }, [timeLeft, testCompleted, testData, handleSubmitTest]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const getSubjectStats = () => {
    if (!testResults || !testData) return {};
    const subjectStats = {};
    const subjects = [...new Set(testData.questions.map((q) => q.subject))];
    
    subjects.forEach((subject) => {
      const subjectQuestions = testData.questions
        .map((q, index) => ({ question: q, index }))
        .filter((item) => item.question.subject === subject);
      const correctAnswers = subjectQuestions.filter(
        (item) => testResults.details[item.index]?.is_correct
      ).length;
      subjectStats[subject] = {
        total: subjectQuestions.length,
        correct: correctAnswers,
        percentage: ((correctAnswers / subjectQuestions.length) * 100).toFixed(1),
      };
    });
    return subjectStats;
  };

  if (authLoading || !testData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-800 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (testCompleted && testResults) {
    const subjectStats = getSubjectStats();
    const overallPercentage = ((testResults.score / testResults.total) * 100).toFixed(1);

    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Completed!</h1>
              <p className="text-gray-600">Your results are ready</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-orange-500 mb-2">
                  {testResults.score}/{testResults.total}
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-2">
                  Score: {overallPercentage}%
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(subjectStats).map(([subject, stats]) => (
                  <div key={subject} className="bg-white rounded-lg p-4 text-center border">
                    <div className="font-medium text-gray-800 mb-2">{subject}</div>
                    <div className="text-2xl font-bold text-orange-500 mb-1">
                      {stats.correct}/{stats.total}
                    </div>
                    <div className="text-sm text-gray-600">{stats.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-x-4">
              <button
                onClick={() => router.push('/mockTests')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                New Test
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-800 hover:bg-black text-white rounded-lg font-medium transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercentage = (answeredCount / testData.questions.length) * 100;

  return (
    <div>
      <Navbar />
      
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-500 mb-2">Time Warning!</h3>
              <p className="text-gray-700">5 minutes remaining</p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-xl font-bold ${timeLeft <= 300 ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{answeredCount}/{testData.questions.length}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitTest}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-4 text-gray-800">Questions</h3>
                <div className="grid grid-cols-4 lg:grid-cols-3 gap-2">
                  {testData.questions.map((_, index) => {
                    const isAnswered = userAnswers.hasOwnProperty(index);
                    const isCurrent = index === currentQuestionIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                          isCurrent
                            ? "bg-orange-500 text-white"
                            : isAnswered
                            ? "bg-gray-800 text-white"
                            : "bg-white border hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="lg:col-span-3">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    {currentQuestion.subject}
                  </span>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {testData.questions.length}
                  </span>
                </div>

                <h2 className="text-lg font-medium mb-6 text-gray-800">
                  {currentQuestion.question}
                </h2>

                {currentQuestion.image_data && (
                  <div className="mb-6 bg-white rounded-lg p-4">
                    <Image
                      src={currentQuestion.image_data}
                      alt="Question diagram"
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const optionLabel = String.fromCharCode(65 + optionIndex);
                    const isSelected = userAnswers[currentQuestionIndex] === optionLabel;
                    
                    return (
                      <label
                        key={optionIndex}
                        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-orange-100 border-2 border-orange-500"
                            : "bg-white border hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={optionLabel}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(currentQuestionIndex, optionLabel)}
                          className="accent-orange-500"
                        />
                        <span className="font-medium text-gray-800">{optionLabel}.</span>
                        <span className="text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(testData.questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === testData.questions.length - 1}
                    className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}