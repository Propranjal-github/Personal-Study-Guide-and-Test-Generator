
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';
import { uploadPDF } from '@/services/api';

interface PDFUploaderProps {
  onUploadComplete?: (data: { pdf_name: string; extracted_items: number }) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    
    // Simulate progress since axios doesn't have progress for small files upload by default
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 20;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 500);

    try {
      const data = await uploadPDF(selectedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      toast({
        title: "PDF uploaded successfully",
        description: `Extracted ${data.extracted_items} items from ${data.pdf_name}`,
      });
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }
      
      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setProgress(0);
      }, 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error uploading PDF:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Study Material</CardTitle>
        <CardDescription>
          Upload PDF materials to extract images and generate questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex-1"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
          
          {(uploading || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-right">
                {progress < 100 ? 'Processing...' : 'Complete!'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
