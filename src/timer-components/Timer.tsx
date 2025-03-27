import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { useToast } from './../hooks/use-toast';

interface TimerProps {
  isTracking: boolean;
  isPaused: boolean;
  sessionStartTime: string | null;
  elapsedSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onTimeUpdate: (seconds: number) => void;
}

export default function Timer({ 
  isTracking, 
  isPaused, 
  sessionStartTime, 
  elapsedSeconds,
  onStart, 
  onPause, 
  onStop,
  onTimeUpdate 
}: TimerProps) {
  const [timeElapsed, setTimeElapsed] = useState<number>(elapsedSeconds * 1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isTracking && !isPaused && sessionStartTime) {
      // Initialize the timer with the current elapsed seconds
      setTimeElapsed(elapsedSeconds * 1000);
      lastUpdateRef.current = Date.now();

      // Start the interval
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdateRef.current;
        lastUpdateRef.current = now;

        setTimeElapsed(prev => {
          const newTime = prev + delta;
          onTimeUpdate(Math.floor(newTime / 1000));
          return newTime;
        });
      }, 1000);
    } else if (elapsedSeconds > 0) {
      // If paused or stopped, just show the current elapsed time
      setTimeElapsed(elapsedSeconds * 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, isPaused, sessionStartTime, elapsedSeconds, onTimeUpdate]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const format = (val: number) => (val < 10 ? `0${val}` : val);

    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  };

  const handleStart = () => {
    onStart();
    toast({
      title: "Tracking Started",
      description: "Time tracking has begun. Screenshots will be taken randomly.",
    });
  };

  const handlePause = () => {
    onPause();
    toast({
      title: "Tracking Paused",
      description: "Time tracking is paused. No screenshots will be taken.",
    });
  };

  const handleStop = () => {
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
          <div className={`flex items-center justify-center w-24 h-24 rounded-full border-4 ${
            isTracking && !isPaused
              ? 'border-primary tracking-active'
              : isPaused
                ? 'border-amber-500 tracking-paused'
                : 'border-gray-300'
          }`}>
            <Clock size={40} className={isTracking ? (isPaused ? "text-amber-500" : "text-primary") : "text-gray-400"} />
          </div>

          <div className="timer-display text-center text-2xl font-mono">
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
