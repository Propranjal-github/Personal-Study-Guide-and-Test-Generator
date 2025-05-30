
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PDFUploader from '@/components/test/PDFUploader';
import QuestionGenerator from '@/components/test/QuestionGenerator';
import { Question } from '@/services/api';

const AIQuestionGenerator: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = React.useState<Question[]>([]);
  
  const handleUploadComplete = (data: { pdf_name: string; extracted_items: number }) => {
    console.log(`Successfully uploaded ${data.pdf_name} with ${data.extracted_items} items`);
  };

  const handleQuestionsGenerated = (questions: Question[]) => {
    setGeneratedQuestions(questions);
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI JEE Question Generator</h1>
      
      <p className="text-muted-foreground mb-8">
        Upload your study materials as PDFs and generate AI-powered JEE questions customized to your syllabus.
      </p>
      
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Materials</TabsTrigger>
          <TabsTrigger value="generate">Generate Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <PDFUploader onUploadComplete={handleUploadComplete} />
          
          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Tips for optimal results:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Upload PDFs with clear diagrams and explanatory text</li>
              <li>Materials should contain physics, chemistry or mathematics content</li>
              <li>Each PDF should focus on specific topics for better question generation</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="generate">
          <QuestionGenerator onQuestionsGenerated={handleQuestionsGenerated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIQuestionGenerator;
