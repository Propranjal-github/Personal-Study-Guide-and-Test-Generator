
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUpdate: (timeLeft: number) => void;
}

export const Timer = ({ initialTime, onTimeUpdate }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        onTimeUpdate(newTime);
        
        // Show warnings when time is running out
        if (newTime === 1800) { // 30 minutes left
          toast({
            title: "30 minutes remaining",
            description: "You have 30 minutes left to complete the test.",
          });
        } else if (newTime === 600) { // 10 minutes left
          toast({
            title: "10 minutes remaining",
            description: "You have 10 minutes left to complete the test.",
            variant: "destructive"
          });
        } else if (newTime === 60) { // 1 minute left
          toast({
            title: "1 minute remaining",
            description: "Please submit your test now!",
            variant: "destructive"
          });
        } else if (newTime <= 0) {
          clearInterval(timer);
          toast({
            title: "Time's up!",
            description: "Your test is being automatically submitted.",
            variant: "destructive"
          });
          // In a real app, we would submit the test here
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUpdate, toast]);

  // Format time as mm:ss
  const formatTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="font-mono text-lg">
      {formatTime()}
    </div>
  );
};
