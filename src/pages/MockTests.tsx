import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';

const MockTests = () => {
  // State for custom test configuration
  const [showCustomTestForm, setShowCustomTestForm] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form for custom test
  const form = useForm({
    defaultValues: {
      numQuestions: 30,
      timeLimit: 45,
      subjects: {
        physics: true,
        chemistry: true,
        mathematics: true,
      },
      topics: [],
      difficulty: "mixed",
    }
  });
  
  // Sample data
  const fullTests = [
    {
      id: 1,
      name: 'JEE Mains 2023 - Full Mock #1',
      questions: 90,
      duration: 180,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      description: 'Complete mock test with balanced difficulty across all subjects.',
    },
    {
      id: 2,
      name: 'JEE Mains 2023 - Full Mock #2',
      questions: 90,
      duration: 180,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      description: 'Focus on high-difficulty questions from previous years.',
    },
    {
      id: 3,
      name: 'JEE Mains 2023 - Full Mock #3',
      questions: 90,
      duration: 180,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      description: 'Simulating real exam conditions with latest pattern questions.',
    },
  ];

  const subjectTests = [
    {
      id: 101,
      name: 'Physics - Mechanics',
      questions: 30,
      duration: 45,
      description: 'Practice test covering kinematics, laws of motion, and work-energy.',
    },
    {
      id: 102,
      name: 'Chemistry - Organic Chemistry',
      questions: 30,
      duration: 45,
      description: 'Focus on reactions, mechanisms, and named reactions.',
    },
    {
      id: 103,
      name: 'Mathematics - Calculus',
      questions: 30,
      duration: 45,
      description: 'Covers differentiation, integration, and applications.',
    },
    {
      id: 104,
      name: 'Physics - Electromagnetism',
      questions: 30,
      duration: 45,
      description: 'Practice problems on electric fields, magnetism, and electromagnetic induction.',
    },
  ];

  // Topics for each subject
  const topicsBySubject = {
    physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics'],
    chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Coordination Chemistry'],
    mathematics: ['Algebra', 'Calculus', 'Trigonometry', 'Coordinate Geometry', 'Statistics']
  };

  const handleCreateCustomTest = async (data: any) => {
    setLoading(true);
    setError(null);
    // Determine selected subject(s)
    const selectedSubjects = Object.entries(data.subjects)
      .filter(([_, checked]) => checked)
      .map(([subject]) => subject.charAt(0).toUpperCase() + subject.slice(1));
    let subject = 'All';
    if (selectedSubjects.length === 1) subject = selectedSubjects[0];
    // Prepare payload
    const payload = {
      subject,
      count: data.numQuestions,
    };
    try {
      const res = await fetch('http://127.0.0.1:5000/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Failed to generate questions');
        return;
      }
      navigate('/custom-test', { state: result });
    } catch (err: any) {
      setError(err.message || 'Error generating test');
    } finally {
      setLoading(false);
      setShowCustomTestForm(false);
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mock Tests</h1>
        <p className="text-muted-foreground">Practice with full-length and topic-specific tests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attempted Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">68%</div>
          </CardContent>
        </Card>
        <Card className="bg-accent text-accent-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Questions Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">764</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">38 hrs</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Create a Custom Test</h3>
                <p className="text-sm text-muted-foreground">
                  Select specific topics and difficulty level based on your preparation needs
                </p>
              </div>
              <Button 
                className="whitespace-nowrap"
                onClick={() => setShowCustomTestForm(!showCustomTestForm)}
              >
                {showCustomTestForm ? 'Hide Options' : 'Create Test'}
              </Button>
            </div>
            
            {showCustomTestForm && (
              <div className="mt-6 border-t pt-4">
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateCustomTest)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Questions</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value.toString()} 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select number of questions" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10 questions</SelectItem>
                                  <SelectItem value="20">20 questions</SelectItem>
                                  <SelectItem value="30">30 questions</SelectItem>
                                  <SelectItem value="60">60 questions</SelectItem>
                                  <SelectItem value="90">90 questions (Full test)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Choose how many questions you want to attempt
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="timeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={5} 
                                max={180} 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Set your desired time limit for the test
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <FormLabel>Subjects</FormLabel>
                      <div className="flex flex-wrap gap-4">
                        <FormField
                          control={form.control}
                          name="subjects.physics"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Physics</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subjects.chemistry"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Chemistry</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subjects.mathematics"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Mathematics</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <FormLabel>Topics</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Filter className="mr-2 h-4 w-4" />
                            {form.watch('topics').length > 0
                              ? `${form.watch('topics').length} selected`
                              : 'Select Topics'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            {Object.entries(topicsBySubject).map(([subject, topics]) => (
                              <div key={subject} className="space-y-2">
                                <h4 className="font-medium capitalize">{subject}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {topics.map(topic => (
                                    <FormField
                                      key={topic}
                                      control={form.control}
                                      name="topics"
                                      render={({ field }) => {
                                        const checked = field.value.includes(topic);
                                        return (
                                          <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    field.onChange([...field.value, topic]);
                                                  } else {
                                                    field.onChange(field.value.filter((t: string) => t !== topic));
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal" htmlFor={topic.toLowerCase().replace(' ', '-')}>{topic}</FormLabel>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-3">
                      <FormLabel>Difficulty Level</FormLabel>
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                  <SelectItem value="mixed">Mixed Difficulty</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Choose the difficulty level for questions
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Generating...' : 'Start Custom Test'}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="full-tests" className="w-full">
        <TabsList>
          <TabsTrigger value="full-tests">Full-Length Tests</TabsTrigger>
          <TabsTrigger value="subject-tests">Subject Tests</TabsTrigger>
          <TabsTrigger value="previous-attempts">Previous Attempts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="full-tests" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fullTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle>{test.name}</CardTitle>
                  <CardDescription>Full-length mock test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{test.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {test.subjects.map((subject, idx) => (
                      <div key={idx} className="px-2 py-1 bg-muted text-xs rounded-md">
                        {subject}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {test.duration} mins
                    </div>
                    <div>{test.questions} questions</div>
                  </div>
                  <Link to={`/mock-tests/${test.id}`}>
                    <Button className="w-full mt-2">Start Test</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="subject-tests" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle>{test.name}</CardTitle>
                  <CardDescription>Subject-focused test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{test.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {test.duration} mins
                    </div>
                    <div>{test.questions} questions</div>
                  </div>
                  <Link to={`/mock-tests/${test.id}`}>
                    <Button variant="outline" className="w-full mt-2">Start Test</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="previous-attempts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Attempts</CardTitle>
              <CardDescription>Review your previous attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h4 className="font-medium">JEE Mains 2023 - Full Mock #1</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="mr-1 h-4 w-4" />
                        Attempted on May 5, 2023
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div>
                        <p className="text-sm font-medium">Score</p>
                        <p>138/300</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Time Taken</p>
                        <p>165 mins</p>
                      </div>
                      <Button variant="outline" size="sm">View Analysis</Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h4 className="font-medium">Physics - Electromagnetism</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="mr-1 h-4 w-4" />
                        Attempted on May 3, 2023
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div>
                        <p className="text-sm font-medium">Score</p>
                        <p>42/60</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Time Taken</p>
                        <p>39 mins</p>
                      </div>
                      <Button variant="outline" size="sm">View Analysis</Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h4 className="font-medium">Chemistry - Organic Chemistry</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="mr-1 h-4 w-4" />
                        Attempted on May 1, 2023
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div>
                        <p className="text-sm font-medium">Score</p>
                        <p>53/60</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Time Taken</p>
                        <p>42 mins</p>
                      </div>
                      <Button variant="outline" size="sm">View Analysis</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MockTests;
