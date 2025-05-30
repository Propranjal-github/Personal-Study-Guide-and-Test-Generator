
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Search, Filter, ArrowRight } from 'lucide-react';

// Mock data for question bank
const questionBankData = [
  {
    id: 201,
    text: 'A particle of mass m is projected with velocity v at an angle θ with the horizontal. The magnitude of angular momentum about the point of projection when the particle is at its highest point is:',
    difficulty: 'Medium',
    subject: 'Physics',
    topic: 'Mechanics',
    chapter: 'Rotational Mechanics',
    source: 'JEE Mains 2022',
    tags: ['angular momentum', 'projectile motion']
  },
  {
    id: 202,
    text: 'A parallel plate capacitor has plates of area 5 cm² separated by 2 mm. If the electric field between the plates is 3 × 10⁶ V/m, the potential difference between the plates is:',
    difficulty: 'Easy',
    subject: 'Physics',
    topic: 'Electricity',
    chapter: 'Capacitors',
    source: 'JEE Mains 2021',
    tags: ['capacitance', 'electric field']
  },
  {
    id: 203,
    text: 'The solubility product of a sparingly soluble salt AB₂ is 3.2 × 10⁻¹¹. The molar solubility of the salt in water is:',
    difficulty: 'Hard',
    subject: 'Chemistry',
    topic: 'Equilibrium',
    chapter: 'Solubility Equilibria',
    source: 'JEE Mains 2022',
    tags: ['equilibrium constant', 'solubility']
  },
  {
    id: 204,
    text: 'The hybridization of carbon atoms in diamond is:',
    difficulty: 'Easy',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    chapter: 'Hybridization',
    source: 'JEE Mains 2020',
    tags: ['hybridization', 'carbon']
  },
  {
    id: 205,
    text: 'If sin x + sin y = a and cos x + cos y = b, then tan((x+y)/2) equals:',
    difficulty: 'Hard',
    subject: 'Mathematics',
    topic: 'Trigonometry',
    chapter: 'Trigonometric Equations',
    source: 'JEE Advanced 2021',
    tags: ['trigonometric equations', 'substitution']
  },
  {
    id: 206,
    text: 'The area bounded by the curves y = x² and y = |x| is:',
    difficulty: 'Medium',
    subject: 'Mathematics',
    topic: 'Calculus',
    chapter: 'Integration',
    source: 'JEE Mains 2021',
    tags: ['definite integrals', 'area']
  }
];

const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];
const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const sources = ['All', 'JEE Mains 2020', 'JEE Mains 2021', 'JEE Mains 2022', 'JEE Advanced 2021'];

const QuestionBank = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter questions based on selected filters
  const filteredQuestions = questionBankData.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubject === 'All' || question.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'All' || question.difficulty === selectedDifficulty;
    const matchesSource = selectedSource === 'All' || question.source === selectedSource;
    
    return matchesSearch && matchesSubject && matchesDifficulty && matchesSource;
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Question Bank</h1>
        <p className="text-muted-foreground">Browse and practice questions from previous years and reference books</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by question text, topic, or tag"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="sm:w-auto w-full"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
      
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Questions</TabsTrigger>
          <TabsTrigger value="physics">Physics</TabsTrigger>
          <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
          <TabsTrigger value="mathematics">Mathematics</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">All Questions</CardTitle>
              <CardDescription>
                {filteredQuestions.length} questions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No questions match your filters.</p>
                    <Button variant="link" onClick={() => {
                      setSearchQuery('');
                      setSelectedSubject('All');
                      setSelectedDifficulty('All');
                      setSelectedSource('All');
                    }}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="physics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Physics Questions</CardTitle>
              <CardDescription>
                {filteredQuestions.filter(q => q.subject === 'Physics').length} questions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredQuestions
                  .filter(q => q.subject === 'Physics')
                  .map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chemistry" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Chemistry Questions</CardTitle>
              <CardDescription>
                {filteredQuestions.filter(q => q.subject === 'Chemistry').length} questions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredQuestions
                  .filter(q => q.subject === 'Chemistry')
                  .map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mathematics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Mathematics Questions</CardTitle>
              <CardDescription>
                {filteredQuestions.filter(q => q.subject === 'Mathematics').length} questions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredQuestions
                  .filter(q => q.subject === 'Mathematics')
                  .map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookmarked" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Bookmarked Questions</CardTitle>
              <CardDescription>You haven't bookmarked any questions yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your bookmarked questions will appear here. Click the bookmark icon on any question to save it for later.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface QuestionCardProps {
  question: any;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{question.text}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{question.subject}</span>
                <span>•</span>
                <span>{question.topic}</span>
                <span>•</span>
                <span>{question.source}</span>
              </div>
            </div>
            <div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <BookOpen className={`h-5 w-5 ${isBookmarked ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag: string) => (
              <div key={tag} className="px-2 py-1 bg-muted text-xs rounded-md">
                {tag}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : ''}
                ${question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${question.difficulty === 'Hard' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {question.difficulty}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary" 
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? 'Hide solution' : 'View solution'}
            </Button>
          </div>
          
          {showSolution && (
            <div className="p-4 bg-muted rounded-md mt-2">
              <h4 className="font-medium mb-2">Solution</h4>
              <p>
                Detailed step-by-step solution for this problem would be displayed here.
                The solution would include all mathematical workings, formulas used, and conceptual explanations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionBank;
