import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import DifficultyRating from '@/components/test/DifficultyRating';

// Mock test data
const mockTestData = {
  id: 1,
  name: 'JEE Mains 2023 - Full Mock #1',
  duration: 180, // in minutes
  questions: [
    {
      id: 101,
      text: '(Q6) The electric field of a plane polarized electromagnetic wave in free space at time t = 0 is given by an expression E(x,y) = E₀cos(kx-ωt)ȷ̂. The magnetic field B(x, z, t) is given by: (c is the velocity of light)',
      options: [
        'E₀/c cos(kx)(-ωt)î',
        'E₀/c cos(kx+ωt)k̂',
        'E₀/c cos(kx-ωt)k̂',
        'E₀/c cos(kx-ωt)î'
      ],
      positiveMarks: 4,
      negativeMarks: 1,
      correctOption: 3,
      subject: 'Physics',
      questionNumber: 6
    },
    {
      id: 102,
      text: 'The pH of a 0.1M solution of a weak acid HA is 4. The ionization constant of the acid is:',
      options: [
        '10⁻⁴',
        '10⁻⁶',
        '10⁻⁸',
        '10⁻¹⁰'
      ],
      positiveMarks: 4,
      negativeMarks: 1,
      correctOption: 2,
      subject: 'Chemistry',
      questionNumber: 7
    },
    {
      id: 103,
      text: 'If the sum of the first n terms of the series 1 + 3 + 5 + 7 + ... is equal to n², then the value of n is:',
      options: [
        '4',
        '6',
        '8',
        '10'
      ],
      positiveMarks: 4,
      negativeMarks: 1,
      correctOption: 0,
      subject: 'Mathematics',
      questionNumber: 8
    }
  ]
};

// Subject filters
const subjects = ['Physics', 'Chemistry', 'Maths'];

type QuestionStatus = 'not-visited' | 'answered' | 'not-answered' | 'marked-for-review' | 'answered-and-marked';

const TakeMockTest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>(Array(mockTestData.questions.length).fill(null));
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>(Array(mockTestData.questions.length).fill('not-visited'));
  const [timeLeft, setTimeLeft] = useState(164 * 60 + 12); // 164 minutes and 12 seconds in seconds
  const [activeSubject, setActiveSubject] = useState<string | null>('Physics');
  const [questionDifficulties, setQuestionDifficulties] = useState<Record<number, string>>({});
  
  const currentQuestion = mockTestData.questions[currentIndex];

  // Format time left as minutes:seconds
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds} Sec`;
  };

  // Mark the current question as visited when it changes
  useEffect(() => {
    if (questionStatuses[currentIndex] === 'not-visited') {
      const newStatuses = [...questionStatuses];
      newStatuses[currentIndex] = 'not-answered';
      setQuestionStatuses(newStatuses);
    }
    
    // Update timer every second
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
    
    const currentStatus = questionStatuses[currentIndex];
    const newStatuses = [...questionStatuses];
    
    if (currentStatus === 'marked-for-review') {
      newStatuses[currentIndex] = 'answered-and-marked';
    } else {
      newStatuses[currentIndex] = 'answered';
    }
    
    setQuestionStatuses(newStatuses);
  };

  const handleDifficultyRating = (difficulty: string) => {
    setQuestionDifficulties(prev => ({
      ...prev,
      [currentQuestion.id]: difficulty
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < mockTestData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleMarkForReview = () => {
    const newStatuses = [...questionStatuses];
    const currentStatus = questionStatuses[currentIndex];
    
    if (currentStatus === 'answered') {
      newStatuses[currentIndex] = 'answered-and-marked';
    } else if (currentStatus === 'answered-and-marked') {
      newStatuses[currentIndex] = 'answered';
    } else if (currentStatus === 'marked-for-review') {
      newStatuses[currentIndex] = 'not-answered';
    } else {
      newStatuses[currentIndex] = 'marked-for-review';
    }
    
    setQuestionStatuses(newStatuses);
    
    toast({
      title: "Question status updated",
      description: "Your marking has been updated."
    });
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const handleClearResponse = () => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentIndex] = null;
    setSelectedOptions(newSelectedOptions);
    
    const newStatuses = [...questionStatuses];
    if (newStatuses[currentIndex] === 'answered-and-marked') {
      newStatuses[currentIndex] = 'marked-for-review';
    } else {
      newStatuses[currentIndex] = 'not-answered';
    }
    setQuestionStatuses(newStatuses);
    
    toast({
      title: "Response cleared",
      description: "Your answer has been cleared."
    });
  };

  const handleSubmitTest = () => {
    // Calculate results and navigate to results page
    const score = selectedOptions.reduce((total, selected, idx) => {
      if (selected === mockTestData.questions[idx].correctOption) {
        return total + mockTestData.questions[idx].positiveMarks;
      } else if (selected !== null) {
        return total - mockTestData.questions[idx].negativeMarks;
      }
      return total;
    }, 0);
    
    // Store test results in localStorage for demo purposes
    localStorage.setItem('lastTestResult', JSON.stringify({
      testId: id,
      score,
      totalQuestions: mockTestData.questions.length,
      selectedOptions,
      timeSpent: mockTestData.duration * 60 - timeLeft,
      questionDifficulties
    }));
    
    navigate(`/mock-test-result/${id}`);
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'not-visited':
        return 'bg-gray-200 text-gray-800';
      case 'answered':
        return 'bg-green-500 text-white';
      case 'not-answered':
        return 'bg-white text-gray-800 border border-gray-300';
      case 'marked-for-review':
        return 'bg-orange-400 text-white';
      case 'answered-and-marked':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Timer Bar */}
      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
        <div className="font-semibold">
          Time Left - <span className="text-blue-600">{formatTimeLeft()}</span>
        </div>
        <div>
          <Button 
            variant="outline"
            onClick={() => navigate('/mock-test-result/' + id)}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Go to Question
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content */}
        <div className="flex-grow">
          {/* Subject Tabs */}
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
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Question No: {currentQuestion.questionNumber}</div>
                <div className="text-sm text-gray-600">
                  Positive Marks: {currentQuestion.positiveMarks} / Negative Marks: {currentQuestion.negativeMarks}
                </div>
              </div>
              
              <div className="mb-6 mt-4 text-lg">
                {currentQuestion.text}
              </div>
              
              <RadioGroup 
                value={selectedOptions[currentIndex]?.toString() || ""}
                onValueChange={(value) => handleOptionSelect(parseInt(value))}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    return (
                      <div key={idx} className="flex items-start space-x-2 border rounded p-3 hover:bg-gray-50">
                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="mt-1" />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">({optionLabels[idx]})</span>
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
              
              {/* Difficulty Rating Component */}
              <DifficultyRating 
                questionId={currentQuestion.id} 
                onRatingChange={handleDifficultyRating} 
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-between items-center">
            <Button
              onClick={handleClearResponse}
              variant="outline"
              className="bg-white"
            >
              Clear Response
            </Button>
            
            <Button
              onClick={handleMarkForReview}
              className="bg-orange-400 hover:bg-orange-500 text-white"
            >
              <Flag className="mr-1 h-4 w-4" />
              Marked for Review & Next
            </Button>
          </div>
        </div>

        {/* Question Palette */}
        <div className="lg:w-96 bg-white rounded-md shadow-sm p-4">
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
          
          <div className="flex justify-between mb-6">
            <Button variant="outline" onClick={handlePreviousQuestion} className="px-3">
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" onClick={handleNextQuestion} className="px-3">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
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
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => {}}
            >
              Test Status
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-orange-400 text-white hover:bg-orange-500"
              onClick={() => {}}
            >
              Question Paper
            </Button>
          </div>
          
          <Button
            variant="default"
            className="w-full mt-4 bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleSubmitTest}
          >
            End Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TakeMockTest;
