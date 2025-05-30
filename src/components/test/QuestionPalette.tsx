
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-for-review';

interface QuestionPaletteProps {
  questions: Array<any>;
  currentIndex: number;
  statuses: QuestionStatus[];
  onQuestionClick: (index: number) => void;
}

export const QuestionPalette = ({
  questions,
  currentIndex,
  statuses,
  onQuestionClick
}: QuestionPaletteProps) => {
  const getStatusColor = (status: QuestionStatus, isActive: boolean) => {
    if (isActive) return 'bg-primary text-primary-foreground';
    
    switch (status) {
      case 'not-visited':
        return 'bg-muted text-muted-foreground';
      case 'not-answered':
        return 'bg-secondary text-secondary-foreground';
      case 'answered':
        return 'bg-green-500 text-white';
      case 'marked-for-review':
        return 'bg-orange-400 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <h3 className="font-medium mb-3">Question Palette</h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-green-500"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-secondary"></div>
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-muted"></div>
          <span>Not Visited</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-orange-400"></div>
          <span>Marked for Review</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {questions.map((_, index) => (
          <Button
            key={index}
            size="sm"
            variant="outline"
            className={cn(
              "h-8 w-8 p-0 font-normal",
              getStatusColor(statuses[index], index === currentIndex)
            )}
            onClick={() => onQuestionClick(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
    </div>
  );
};
