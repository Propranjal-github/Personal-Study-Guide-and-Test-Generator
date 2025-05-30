
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, HelpCircle, ArrowLeft } from 'lucide-react';

// Mock test data (same as in TakeMockTest.tsx for consistency)
const mockTestData = {
  id: 1,
  name: 'JEE Mains 2023 - Full Mock #1',
  duration: 180, // in minutes
  questions: [
    {
      id: 101,
      text: 'A particle moves along a straight line such that its displacement at time t is given by x = 3t² - 4t³, where x is in meters and t is in seconds. The acceleration of the particle at t = 2s is:',
      options: [
        'a) -48 m/s²',
        'b) -24 m/s²',
        'c) 0 m/s²',
        'd) 24 m/s²'
      ],
      correctOption: 1,
      explanation: 'Given displacement equation is x = 3t² - 4t³. Velocity is given by v = dx/dt = 6t - 12t². Acceleration is a = dv/dt = 6 - 24t. At t = 2s, a = 6 - 24(2) = 6 - 48 = -42 m/s²',
      subject: 'Physics',
      topic: 'Kinematics'
    },
    {
      id: 102,
      text: 'The pH of a 0.1M solution of a weak acid HA is 4. The ionization constant of the acid is:',
      options: [
        'a) 10⁻⁴',
        'b) 10⁻⁶',
        'c) 10⁻⁸',
        'd) 10⁻¹⁰'
      ],
      correctOption: 2,
      explanation: 'For a weak acid HA, pH = -log[H⁺]. Given pH = 4, so [H⁺] = 10⁻⁴. For weak acid, Ka = [H⁺]²/([HA] - [H⁺]) ≈ [H⁺]²/[HA] = (10⁻⁴)²/0.1 = 10⁻⁸',
      subject: 'Chemistry',
      topic: 'Ionic Equilibrium'
    },
    {
      id: 103,
      text: 'If the sum of the first n terms of the series 1 + 3 + 5 + 7 + ... is equal to n², then the value of n is:',
      options: [
        'a) 4',
        'b) 6',
        'c) 8',
        'd) 10'
      ],
      correctOption: 0,
      explanation: 'Sum of first n terms of the series 1 + 3 + 5 + ... + (2n-1) = n². This is a known formula for the sum of first n odd numbers. So we already have sum = n², meaning the value of n is 4.',
      subject: 'Mathematics',
      topic: 'Sequences and Series'
    }
  ]
};

const MockTestResult = () => {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would fetch results from the backend
    const savedResult = localStorage.getItem('lastTestResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
  }, [id]);

  if (!result) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Loading results...</h2>
      </div>
    );
  }

  const correctAnswers = result.selectedOptions.filter(
    (option: number | null, idx: number) => option === mockTestData.questions[idx].correctOption
  ).length;
  
  const incorrectAnswers = result.selectedOptions.filter(
    (option: number | null, idx: number) => option !== null && option !== mockTestData.questions[idx].correctOption
  ).length;
  
  const unattempted = result.selectedOptions.filter(
    (option: number | null) => option === null
  ).length;
  
  const accuracy = correctAnswers / (correctAnswers + incorrectAnswers) * 100;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  const subjectPerformance = mockTestData.questions.reduce((acc: Record<string, any>, question, idx) => {
    const subject = question.subject;
    const isCorrect = result.selectedOptions[idx] === question.correctOption;
    const isAttempted = result.selectedOptions[idx] !== null;
    
    if (!acc[subject]) {
      acc[subject] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
    }
    
    acc[subject].total += 1;
    
    if (isAttempted) {
      if (isCorrect) {
        acc[subject].correct += 1;
      } else {
        acc[subject].incorrect += 1;
      }
    } else {
      acc[subject].unattempted += 1;
    }
    
    return acc;
  }, {});

  return (
    <div className="container py-8">
      <Link to="/mock-tests" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Mock Tests
      </Link>

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Result: {mockTestData.name}</CardTitle>
            <CardDescription>
              Completed on {new Date().toLocaleDateString()} • Time taken: {formatTime(result.timeSpent)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold">{result.score}/{mockTestData.questions.length * 4}</CardTitle>
                  <CardDescription>Total Score</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-green-500">{correctAnswers}</CardTitle>
                  <CardDescription>Correct Answers</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-red-500">{incorrectAnswers}</CardTitle>
                  <CardDescription>Incorrect Answers</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl font-bold text-muted-foreground">{unattempted}</CardTitle>
                  <CardDescription>Unattempted</CardDescription>
                </CardHeader>
              </Card>
            </div>
            
            <div className="mb-8">
              <h3 className="font-medium mb-2">Accuracy</h3>
              <div className="flex items-center gap-4">
                <Progress value={accuracy} className="flex-1" />
                <span>{Math.round(accuracy)}%</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Subject-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(subjectPerformance).map(([subject, data]: [string, any]) => (
                  <Card key={subject}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{subject}</CardTitle>
                      <CardDescription>
                        Score: {data.correct * 4 - data.incorrect}/{data.total * 4}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-500">Correct</span>
                          <span>{data.correct}/{data.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-500">Incorrect</span>
                          <span>{data.incorrect}/{data.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unattempted</span>
                          <span>{data.unattempted}/{data.total}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="incorrect">Incorrect ({incorrectAnswers})</TabsTrigger>
            <TabsTrigger value="unattempted">Unattempted ({unattempted})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-6">
              {mockTestData.questions.map((question, idx) => (
                <QuestionReview 
                  key={question.id}
                  question={question}
                  selectedOption={result.selectedOptions[idx]}
                  index={idx}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="incorrect">
            <div className="space-y-6">
              {mockTestData.questions.map((question, idx) => {
                if (result.selectedOptions[idx] !== null && result.selectedOptions[idx] !== question.correctOption) {
                  return (
                    <QuestionReview 
                      key={question.id}
                      question={question}
                      selectedOption={result.selectedOptions[idx]}
                      index={idx}
                    />
                  );
                }
                return null;
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="unattempted">
            <div className="space-y-6">
              {mockTestData.questions.map((question, idx) => {
                if (result.selectedOptions[idx] === null) {
                  return (
                    <QuestionReview 
                      key={question.id}
                      question={question}
                      selectedOption={result.selectedOptions[idx]}
                      index={idx}
                    />
                  );
                }
                return null;
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface QuestionReviewProps {
  question: any;
  selectedOption: number | null;
  index: number;
}

const QuestionReview = ({ question, selectedOption, index }: QuestionReviewProps) => {
  const [showExplanation, setShowExplanation] = useState(false);
  
  const isCorrect = selectedOption === question.correctOption;
  const isUnattempted = selectedOption === null;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Question {index + 1} 
              {isUnattempted ? (
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              ) : isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
            <CardDescription>
              {question.subject} • {question.topic}
            </CardDescription>
          </div>
          <div className="text-sm font-medium">
            {isUnattempted ? (
              <span className="text-muted-foreground">Not attempted</span>
            ) : isCorrect ? (
              <span className="text-green-500">+4 points</span>
            ) : (
              <span className="text-red-500">-1 point</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>{question.text}</div>
        
        <div className="space-y-2">
          {question.options.map((option: string, optIdx: number) => (
            <div 
              key={optIdx}
              className={`
                p-3 rounded-md border 
                ${optIdx === question.correctOption ? 'bg-green-50 border-green-200' : ''}
                ${optIdx === selectedOption && optIdx !== question.correctOption ? 'bg-red-50 border-red-200' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div>{option}</div>
                <div>
                  {optIdx === question.correctOption && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {optIdx === selectedOption && optIdx !== question.correctOption && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowExplanation(!showExplanation)}
        >
          {showExplanation ? "Hide" : "Show"} Explanation
        </Button>
        
        {showExplanation && (
          <div className="p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Explanation</h4>
            <p>{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MockTestResult;
