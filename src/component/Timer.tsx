
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { useToast } from './../hooks/use-toast';

interface TimerProps {
  isTracking: boolean;
  isPaused: boolean;
  sessionStartTime: string | null;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function Timer({ isTracking, isPaused, sessionStartTime, onStart, onPause, onStop }: TimerProps) {
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking && !isPaused && sessionStartTime) {
      console.log('Timer started with session time:', sessionStartTime);
      const startTime = new Date(sessionStartTime).getTime();

      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        console.log('Time elapsed:', elapsed);
        setTimeElapsed(elapsed);
      }, 1000);
    } else {
      console.log('Timer state:', { isTracking, isPaused, sessionStartTime });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, isPaused, sessionStartTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const format = (val: number) => (val < 10 ? `0${val}` : val);

    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  };

  const handleStart = () => {
    console.log('Start button clicked');
    onStart();
    toast({
      title: "Tracking Started",
      description: "Time tracking has begun. Screenshots will be taken randomly.",
    });
  };

  const handlePause = () => {
    console.log('Pause button clicked');
    onPause();
    toast({
      title: "Tracking Paused",
      description: "Time tracking is paused. No screenshots will be taken.",
    });
  };

  const handleStop = () => {
    console.log('Stop button clicked');
    onStop();
    toast({
      title: "Tracking Stopped",
      description: "Time tracking has been stopped and session saved.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${isTracking && !isPaused
              ? 'border-primary tracking-active'
              : isPaused
                ? 'border-amber-500 tracking-paused'
                : 'border-gray-300'
            }`}>
            <Clock size={40} className={isTracking ? (isPaused ? "text-amber-500" : "text-primary") : "text-gray-400"} />
          </div>

          <div className="timer-display text-center">
            {formatTime(timeElapsed)}
          </div>

          <div className="text-sm text-muted-foreground">
            {isTracking
              ? (isPaused
                ? "Tracking paused"
                : "Currently tracking")
              : "Ready to start tracking"}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center space-x-4 pb-6">
        {!isTracking ? (
          <Button onClick={handleStart} className="px-8">
            <Play size={18} className="mr-2" />
            Start
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button onClick={handleStart} variant="outline" className="px-8">
                <Play size={18} className="mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="px-8">
                <Pause size={18} className="mr-2" />
                Pause
              </Button>
            )}

            <Button onClick={handleStop} variant="destructive" className="px-8">
              <Square size={18} className="mr-2" />
              Stop
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
