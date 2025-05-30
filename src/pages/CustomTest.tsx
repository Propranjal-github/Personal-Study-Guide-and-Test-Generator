import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import cn from 'classnames';
import DifficultyRating from '@/components/test/DifficultyRating';

// DifficultyRating component placeholder (you can replace it with your real one)

const subjects = ['Physics', 'Chemistry', 'Maths']; 

const CustomTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get data from location state (backend sends questions etc)
  const { questions = [], subject = '', count = 0 } = location.state || {};

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [questionStatuses, setQuestionStatuses] = useState<string[]>(Array(questions.length).fill('not-visited'));
  const [questionDifficulties, setQuestionDifficulties] = useState<Record<number, string>>({});
  const [activeSubject, setActiveSubject] = useState<string | null>('Physics');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);


  // Current question for convenience
  const currentQuestion = questions[currentIndex];
  
  const handleDifficultyRating = (difficulty: string) => {
      setQuestionDifficulties(prev => ({
        ...prev,
        [currentQuestion.id]: difficulty
      }));
    };
  // When question changes, mark 'not-visited' to 'not-answered'
  useEffect(() => {
    if (questionStatuses[currentIndex] === 'not-visited') {
      const newStatuses = [...questionStatuses];
      newStatuses[currentIndex] = 'not-answered';
      setQuestionStatuses(newStatuses);
    }

    // Debugging logs to check questions and current question data
    console.log('Questions:', questions);
    console.log('Current Question:', currentQuestion);
  }, [currentIndex]);

  // Select option handler
  const handleOptionSelect = (selectedIdx: number) => {
    const updated = [...selectedOptions];
    updated[currentIndex] = selectedIdx;
    setSelectedOptions(updated);
  };


  // Clear response
  const handleClearResponse = () => {
    const newSelected = [...selectedOptions];
    newSelected[currentIndex] = null;
    setSelectedOptions(newSelected);

    const newStatuses = [...questionStatuses];
    newStatuses[currentIndex] = 'not-answered';
    setQuestionStatuses(newStatuses);

    toast({
      title: 'Response Cleared',
      description: 'You have cleared your answer for this question.',
    });
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Mark for review and move next
  const handleMarkForReview = () => {
    const newStatuses = [...questionStatuses];
    if (questionStatuses[currentIndex] === 'answered') {
      newStatuses[currentIndex] = 'answered-and-marked';
    } else {
      newStatuses[currentIndex] = 'marked-for-review';
    }
    setQuestionStatuses(newStatuses);

    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  // Jump to specific question
  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  // Submit test and save results to localStorage
  // const handleFinishTest = () => {
  //   const result = {
  //     subject,
  //     total: questions.length,
  //     attempted: selectedOptions.filter(opt => opt !== null).length,
  //     selectedOptions,
  //   };
  //   localStorage.setItem('customTestResult', JSON.stringify(result));
  //   toast({
  //     title: 'Test Submitted',
  //     description: 'Your test results have been saved.',
  //   });
  //   navigate('/mock-tests');
  // };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleAnswerChange = (index: number, selected: string) => {
    const updated = [...userAnswers];
    updated[index] = selected;
    setUserAnswers(updated);
  };

  // Helper function: get status color for question palette
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-visited':
        return 'bg-gray-300';
      case 'not-answered':
        return 'bg-red-400 text-white';
      case 'answered':
        return 'bg-green-500 text-white';
      case 'marked-for-review':
        return 'bg-yellow-400 text-white';
      case 'answered-and-marked':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-300';
    }
  };

  const getLegendColor = (status: string) => {
    switch (status) {
      case 'not-visited':
        return 'bg-gray-200';
      case 'answered':
        return 'bg-green-500';
      case 'not-answered':
        return 'bg-white border border-gray-300';
      case 'marked-for-review':
        return 'bg-orange-400';
      case 'answered-and-marked':
        return 'bg-purple-500';
      default:
        return 'bg-gray-200';
    }
  };

  if (!questions.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">No questions found!</h2>
        <Button onClick={() => navigate('/mock-tests')}>Back to Mock Tests</Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    const userAnswers = selectedOptions.map((optIdx, qIdx) =>
      questions[qIdx].options[optIdx]
    );

    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: questions,
        userAnswers: userAnswers
      }),
    });

    const resultData = await res.json();

    navigate('/results', {
      state: {
        result: resultData,
        questions: questions,
        userAnswers: userAnswers
      }
    });
  };


  // After user submits test
 

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
        <div className="font-semibold text-lg">
          Question {currentIndex + 1} of {questions.length} - {subject}
        </div>
        <div className="space-x-2">
          <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button onClick={handleNext} disabled={currentIndex === questions.length - 1} variant="outline">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
      <div className='flex flex-col lg:flex-row gap-4 lg:items-start'>
        <div className="w-full lg:flex-[3] min-h-[600px]">
          <div className="flex mb-4 overflow-x-auto">
            {subjects.map((subject) => (
              <Button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={cn(
                  "rounded-full mr-2",
                  activeSubject === subject 
                    ? "bg-blue-500 hover:bg-blue-600 text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                )}
              >
                {subject}
              </Button>
            ))}
          </div>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="mb-4 text-lg font-medium">{currentQuestion.question}</div>

              {/* Show image if available */}
              {currentQuestion.image_data && currentQuestion.image_data.length > 0 && (
                <img
                  src={currentQuestion.image_data}
                  alt="Question Image"
                  className="my-4 max-w-full max-h-[300px] object-contain border rounded"
                />
              )}

              <RadioGroup
                value={selectedOptions[currentIndex]?.toString() || ''}
                onValueChange={(value) => handleOptionSelect(parseInt(value))}
              >

                {currentQuestion.options.map((option: string, idx: number) => {
                  const optionLabels = ['A', 'B', 'C', 'D'];
                  return (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 border rounded-md p-3 cursor-pointer hover:bg-gray-100"
                    >
                      <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        <span className="font-semibold mr-2">({optionLabels[idx]})</span>
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handleClearResponse}>
                  Clear Response
                </Button>

                <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={handleMarkForReview}>
                  <Flag className="w-4 h-4 mr-1" /> Mark for Review & Next
                </Button>
              </div>

              {/* Difficulty Rating */}
              <DifficultyRating 
                    questionId={currentQuestion.id} 
                    onRatingChange={handleDifficultyRating} 
                  />
            </CardContent>
          </Card>
        </div>
      


        {/* Question Palette */}

        <div className="w-full lg:w-[320px] bg-white rounded-md shadow-sm p-4 shrink-0 mt-14">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {Array.from({ length: 15 }, (_, i) => (
              <Button
                key={i}
                onClick={() => handleJumpToQuestion(i)}
                className={cn(
                  "h-8 w-8 p-0",
                  i < questionStatuses.length ? getStatusColor(questionStatuses[i]) : "bg-gray-200",
                  i === currentIndex ? "ring-2 ring-blue-500" : ""
                )}
                variant="outline"
              >
                {i + 1}
              </Button>
            ))}
          </div>
          
          
          
          <div className="space-y-2 mb-6">
            <div className="text-sm font-medium">Legend:</div>
            <div className="flex items-center">
              <div className={cn("h-4 w-4 rounded mr-2", getLegendColor('not-visited'))}></div>
              <span className="text-xs">Not Visited</span>
            </div>
            <div className="flex items-center">
              <div className={cn("h-4 w-4 rounded mr-2", getLegendColor('not-answered'))}></div>
              <span className="text-xs">Not Answered</span>
            </div>
            <div className="flex items-center">
              <div className={cn("h-4 w-4 rounded mr-2", getLegendColor('answered'))}></div>
              <span className="text-xs">Answered</span>
            </div>
            <div className="flex items-center">
              <div className={cn("h-4 w-4 rounded mr-2", getLegendColor('marked-for-review'))}></div>
              <span className="text-xs">Marked for Review</span>
            </div>
            <div className="flex items-center">
              <div className={cn("h-4 w-4 rounded mr-2", getLegendColor('answered-and-marked'))}></div>
              <span className="text-xs">Answered and Marked for Review</span>
            </div>
          </div>

          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Finish Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomTest;
