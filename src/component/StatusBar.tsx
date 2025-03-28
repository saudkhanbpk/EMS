import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useActivity } from './../hooks/use-activity';

interface StatusBarProps {
  isTracking: boolean;
  isPaused: boolean;
  lastScreenshot: string | null;
  inactivityTimeout: number; // in milliseconds
}

export default function StatusBar({ isTracking, isPaused, lastScreenshot, inactivityTimeout }: StatusBarProps) {
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [isInactive, setIsInactive] = useState(false);

  // Memoize the activity handler
  const handleActivity = useCallback(() => {
    setLastActivity(new Date());
    setIsInactive(false);
  }, []);

  // Handle activity detection
  useActivity(handleActivity, 1000);

  // Check for inactivity
  useEffect(() => {
    if (!isTracking || isPaused) {
      setIsInactive(false);
      return;
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const inactivityDuration = now.getTime() - lastActivity.getTime();

      if (inactivityDuration > inactivityTimeout * 0.8) { // 80% of timeout - warning
        setIsInactive(true);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isTracking, isPaused, lastActivity, inactivityTimeout]);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isTracking
              ? isPaused
                ? 'bg-amber-500'
                : 'bg-green-500 animate-pulse'
              : 'bg-gray-400'
            }`}></div>
          <span>
            {isTracking
              ? isPaused
                ? 'Tracking Paused'
                : 'Currently Tracking'
              : 'Tracking Inactive'}
          </span>
        </div>

        {lastScreenshot && (
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            <span>Last screenshot: {lastScreenshot}</span>
          </div>
        )}
      </div>

      {isInactive && isTracking && !isPaused && (
        <div className="flex items-center text-amber-500">
          <AlertCircle size={14} className="mr-1.5" />
          <span>Inactivity detected - tracking will pause soon</span>
        </div>
      )}
    </div>
  );
}
