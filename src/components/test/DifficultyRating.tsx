
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/components/ui/use-toast';

interface DifficultyRatingProps {
  questionId: number;
  onRatingChange?: (difficulty: string) => void;
}

const DifficultyRating: React.FC<DifficultyRatingProps> = ({ questionId, onRatingChange }) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string | undefined>(undefined);
  const { toast } = useToast();

  const handleDifficultyChange = (value: string) => {
    setSelectedDifficulty(value);
    onRatingChange?.(value);
    
    toast({
      title: "Difficulty rated",
      description: `You rated this question as ${value.toLowerCase()}.`,
    });
  };

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Rate this question's difficulty:</p>
        <ToggleGroup 
          type="single" 
          value={selectedDifficulty} 
          onValueChange={handleDifficultyChange}
        >
          <ToggleGroupItem value="Easy" className="text-green-600">
            Easy
          </ToggleGroupItem>
          <ToggleGroupItem value="Medium" className="text-amber-600">
            Medium
          </ToggleGroupItem>
          <ToggleGroupItem value="Hard" className="text-red-600">
            Hard
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default DifficultyRating;
