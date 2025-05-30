import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { generateQuestions, getSubjects, Question } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import DifficultyRating from '@/components/test/DifficultyRating';

interface QuestionGeneratorProps {
  onQuestionsGenerated?: (questions: Question[]) => void;
}

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ onQuestionsGenerated }) => {
  const [subjects, setSubjects] = useState<string[]>(['All', 'Physics', 'Chemistry', 'Mathematics']);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load subjects from the API if backend is available
    const loadSubjects = async () => {
      try {
        const { subjects: apiSubjects } = await getSubjects();
        if (apiSubjects && apiSubjects.length > 0) {
          setSubjects(['All', ...apiSubjects]);
        }
      } catch (error) {
        console.log('Could not load subjects from API. Using defaults.');
      }
    };
    
    loadSubjects();
  }, []);
  
  const handleGenerateQuestions = async () => {
    setLoading(true);
    
    try {
      const response = await generateQuestions(selectedSubject, questionCount);
      setQuestions(response.questions);
      setCurrentQuestionIndex(0);
      
      toast({
        title: "Questions generated",
        description: `Generated ${response.questions.length} ${selectedSubject} questions`,
      });
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated(response.questions);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Failed to generate questions",
        description: "There was an error generating questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleDifficultyRating = (difficulty: string) => {
    console.log(`Question ${currentQuestionIndex + 1} rated as ${difficulty}`);
    // Here you could send this data to your backend if needed
  };
  
  const parseQuestion = (questionText: string) => {
    // Parse the question format: Q:... A:... B:... C:... D:... Answer:...
    const lines = questionText.split('\n').filter(line => line.trim());
    
    const questionObject = {
      questionText: '',
      options: [] as { label: string, text: string }[],
      answer: ''
    };
    
    for (const line of lines) {
      if (line.startsWith('Q:')) {
        questionObject.questionText = line.substring(2).trim();
      } else if (line.match(/^[A-D]\./) || line.match(/^[A-D]\)/)) {
        const optionLabel = line[0];
        const optionText = line.substring(2).trim();
        questionObject.options.push({ label: optionLabel, text: optionText });
      } else if (line.toLowerCase().startsWith('answer:')) {
        questionObject.answer = line.substring(7).trim();
      }
    }
    
    return questionObject;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Questions</CardTitle>
          <CardDescription>
            Configure your question set and generate questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Number of Questions</label>
                <span className="text-sm text-muted-foreground">{questionCount}</span>
              </div>
              <Slider
                value={[questionCount]}
                onValueChange={([value]) => setQuestionCount(value)}
                min={1}
                max={20}
                step={1}
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={handleGenerateQuestions} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Questions'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions[currentQuestionIndex] && (
              <div className="space-y-6">
                {questions[currentQuestionIndex].image_data && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={questions[currentQuestionIndex].image_data} 
                      alt="Question diagram"
                      className="max-h-64 object-contain border rounded-md"
                    />
                  </div>
                )}
                
                {(() => {
                  const parsedQ = parseQuestion(questions[currentQuestionIndex].question);
                  return (
                    <div className="space-y-4">
                      <p className="text-lg font-medium">{parsedQ.questionText}</p>
                      
                      <div className="space-y-2">
                        {parsedQ.options.map((option, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 border rounded-md hover:bg-muted transition-colors"
                          >
                            <span className="font-medium mr-2">{option.label}.</span>
                            {option.text}
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="font-medium">Answer: <span className="text-primary">{parsedQ.answer}</span></p>
                      </div>
                      
                      <DifficultyRating 
                        questionId={currentQuestionIndex} 
                        onRatingChange={handleDifficultyRating} 
                      />
                    </div>
                  );
                })()}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionGenerator;
