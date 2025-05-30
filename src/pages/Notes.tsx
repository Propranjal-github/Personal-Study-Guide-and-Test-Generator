
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, FileText, Download, Star, ArrowRight, Link } from 'lucide-react';

// Mock data for quick notes
const quickNotesData = [
  {
    id: 309,
    title: 'Important Notes- Physics',
    description: 'Key equations and formulas for physics',
    subject: 'Physics',
    
    type: 'Formula Sheet',
    content: 'This would contain all important mechanics formulas.',
    link: 'https://drive.google.com/file/d/1xnCHu_sJUmwDcFWnGl7SGurePkrn-x0O/view'
  },
  {
    id: 307,
    title: 'Important Reactions - Chemistry',
    description: 'Summary of important reactions in chemistry',
    subject: 'Chemistry',
    topic: '',
    type: 'Summary',
    content: 'This would contain all important chemistry reactions.'
  },
  {
    id: 308,
    title: 'Important Formulas - Mathematics',
    description: 'Quick solving techniques for different problems',
    subject: 'Mathematics',
    topic: '',
    type: 'Tips & Tricks',
    content: 'This would contain all important calculus tips and tricks.'
  },
  {
    id: 301,
    title: 'Important Formulas - Mechanics',
    description: 'Key equations and formulas for mechanics section',
    subject: 'Physics',
    topic: 'Mechanics',
    type: 'Formula Sheet',
    content: 'This would contain all important mechanics formulas.'
  },
  {
    id: 302,
    title: 'Organic Chemistry Reactions',
    description: 'Summary of important reactions in organic chemistry',
    subject: 'Chemistry',
    topic: 'Organic Chemistry',
    type: 'Summary',
    content: 'This would contain all important organic chemistry reactions.'
  },
  {
    id: 303,
    title: 'Calculus Tricks',
    description: 'Quick solving techniques for calculus problems',
    subject: 'Mathematics',
    topic: 'Calculus',
    type: 'Tips & Tricks',
    content: 'This would contain all important calculus tips and tricks.'
  },
  {
    id: 304,
    title: 'Electromagnetism Concepts',
    description: 'Core concepts and principles of electromagnetism',
    subject: 'Physics',
    topic: 'Electromagnetism',
    type: 'Concept Map',
    content: 'This would contain all important electromagnetism concepts.'
  },
  {
    id: 305,
    title: 'Periodic Table Trends',
    description: 'Patterns and trends in the periodic table',
    subject: 'Chemistry',
    topic: 'Inorganic Chemistry',
    type: 'Summary',
    content: 'This would contain all important periodic table trends.'
  },
  {
    id: 306,
    title: 'Trigonometry Quick Reference',
    description: 'Essential trigonometric identities and formulas',
    subject: 'Mathematics',
    topic: 'Trigonometry',
    type: 'Formula Sheet',
    content: 'This would contain all important trigonometry formulas and identities.'
  }
];

const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics'];
const noteTypes = ['All', 'Formula Sheet', 'Summary', 'Concept Map', 'Tips & Tricks'];

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  
  // Filter notes based on selected filters
  const filteredNotes = quickNotesData.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    const matchesType = selectedType === 'All' || note.type === selectedType;
    
    return matchesSearch && matchesSubject && matchesType;
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quick Notes</h1>
        <p className="text-muted-foreground">Access important notes, formulas, and reference materials for quick revision</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, description, or topic"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {noteTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="formulas">Formula Sheets</TabsTrigger>
          <TabsTrigger value="summaries">Summaries</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
          
          {filteredNotes.length === 0 && (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notes match your search criteria.</p>
              <Button variant="link" onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
                setSelectedType('All');
              }}>
                Clear all filters
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="formulas" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes
              .filter(note => note.type === 'Formula Sheet')
              .map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            }
          </div>
        </TabsContent>
        
        <TabsContent value="summaries" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes
              .filter(note => note.type === 'Summary')
              .map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            }
          </div>
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Favorites</CardTitle>
              <CardDescription>You haven't favorited any notes yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your favorite notes will appear here. Click the star icon on any note to save it for easy access.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Create Custom Notes</CardTitle>
          <CardDescription>
            Create your own notes, formula sheets, or cheat sheets for efficient revision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm">
                Organize your own study materials and access them anytime, anywhere.
              </p>
            </div>
            <Button>
              Create Note
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface NoteCardProps {
  note: any;
}

const NoteCard = ({ note }: NoteCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const getTypeIcon = () => {
    switch(note.type) {
      case 'Formula Sheet':
        return 'text-blue-500 bg-blue-100';
      case 'Summary':
        return 'text-green-500 bg-green-100';
      case 'Concept Map':
        return 'text-purple-500 bg-purple-100';
      case 'Tips & Tricks':
        return 'text-amber-500 bg-amber-100';
      default:
        return 'text-primary bg-primary/10';
    }
  };
  
  const getTypeIconComponent = () => {
    switch(note.type) {
      case 'Formula Sheet':
        return FileText;
      case 'Summary':
        return BookOpen;
      default:
        return FileText;
    }
  };
  
  const IconComponent = getTypeIconComponent();
  
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded ${getTypeIcon()}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        <CardTitle className="mt-2">{note.title}</CardTitle>
        <CardDescription>{note.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 bg-muted text-xs rounded-md">
            {note.subject}
          </div>
          <div className="px-2 py-1 bg-muted text-xs rounded-md">
            {note.topic}
          </div>
          <div className="px-2 py-1 bg-muted text-xs rounded-md">
            {note.type}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 mt-auto">
        <div className="flex justify-between w-full">
          <Button variant="ghost" size="sm">
            <a href={note.link}>
            Preview</a>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Notes;
