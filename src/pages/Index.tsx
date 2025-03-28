import React, { useState, useEffect } from 'react';
import Timer from './../timer-components/Timer';
import ScreenshotGallery from './../timer-components/ScreenshotGallery';
import SessionHistory from './../timer-components/SessionHistory';
import StatusBar from './../timer-components/StatusBar';
import AppHeader from './../timer-components/AppHeader';
import ActivityStats from './../timer-components/ActivityStats';
import { Tabs, TabsContent } from './../timer-components/ui/tabs';
import { useToast } from './../hooks/use-toast';
import { useActivity } from './../hooks/use-activity';
import { useTimeTrackerStore, TimeSession } from '../lib/timeTrackerStore';

// Electron IPC interface
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data?: any) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
      }
    }
  }
}

interface Screenshot {
  id: string;
  timestamp: string;
  path: string;
  data?: string;
}

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  pauseHistory?: { pausedAt: string; resumedAt?: string; reason?: string }[];
  totalDuration?: number;
  screenshots: Screenshot[];
}

interface ActivityData {
  mouseActivity: number;
  keyboardActivity: number;
  isActive: boolean;
  lastActivityTime: Date;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('tracker');
  const { toast } = useToast();
  const {
    currentSession,
    isTracking,
    elapsedSeconds,
    lastScreenshotTime,
    sessions,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    loadSessions,
    updateElapsedTime
  } = useTimeTrackerStore();

  const [activityData, setActivityData] = useState({
    mouseActivity: 0,
    keyboardActivity: 0,
    isActive: true,
    lastActivityTime: new Date()
  });

  // Use the activity hook
  const currentActivity = useActivity((stats) => {
    setActivityData(stats);
  });

  useEffect(() => {
    // Load initial sessions
    loadSessions();
  }, [loadSessions]);

  const handleStart = async () => {
    try {
      await startTracking();
      toast({
        title: "Tracking Started",
        description: `Session started at ${new Date().toLocaleTimeString()}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start tracking session",
        variant: "destructive"
      });
    }
  };

  const handlePause = () => {
    pauseTracking();
    toast({
      title: "Tracking Paused",
      description: "Your work session has been paused."
    });
  };

  const handleStop = async () => {
    try {
      await stopTracking();
      toast({
        title: "Tracking Stopped",
        description: "Your work session has ended and been saved."
      });
      // Reload sessions after stopping
      loadSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop tracking session",
        variant: "destructive"
      });
    }
  };

  const handleViewSession = (sessionId: string) => {
    // This will be handled by the SessionHistory component
    console.log('View session requested:', sessionId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} className="space-y-6">
          <TabsContent value="tracker" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Timer
                  isTracking={isTracking}
                  isPaused={!isTracking && !!currentSession}
                  sessionStartTime={currentSession?.startTime}
                  elapsedSeconds={elapsedSeconds}
                  onStart={handleStart}
                  onPause={handlePause}
                  onStop={handleStop}
                  onTimeUpdate={updateElapsedTime}
                />
                <StatusBar
                  isTracking={isTracking}
                  lastScreenshotTime={lastScreenshotTime}
                  activityData={activityData}
                />
              </div>
              <div className="space-y-4">
                <ScreenshotGallery
                  screenshots={currentSession?.screenshots || []}
                  isLoading={false}
                />
                <ActivityStats activityData={activityData} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history" className="space-y-6">
            <SessionHistory
              sessions={sessions}
              onViewSession={handleViewSession}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
