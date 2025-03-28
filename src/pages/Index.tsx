import React, { useState, useEffect } from 'react';
import Timer from './../component/Timer';
import ScreenshotGallery from './../component/ScreenshotGallery';
import SessionHistory from './../component/SessionHistory';
import StatusBar from './../component/StatusBar';
import AppHeader from './../component/AppHeader';
import ActivityStats from './../component/ActivityStats';
import { Tabs, TabsContent } from './../component/ui/tabs';
import { useToast } from './../hooks/use-toast';
import { useActivity } from './../hooks/use-activity';

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
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastScreenshotTime, setLastScreenshotTime] = useState<string | null>(null);
  const [isLoadingScreenshots, setIsLoadingScreenshots] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<ActivityData>({
    mouseActivity: 0,
    keyboardActivity: 0,
    isActive: true,
    lastActivityTime: new Date()
  });
  const { toast } = useToast();

  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

  // Use the activity hook
  const currentActivity = useActivity((stats) => {
    setActivityData(stats);
    if (isElectron && isTracking) {
      window.electron.ipcRenderer.send('activity-update', stats);
    }
  });

  useEffect(() => {
    if (!isElectron) {
      console.log('Not running in Electron environment');
      toast({
        title: "Electron Not Detected",
        description: "This app requires Electron to function properly.",
        variant: "destructive"
      });
      return;
    }

    console.log('Setting up IPC listeners in Electron environment');

    // Initialize with current tracking status
    window.electron.ipcRenderer.send('get-tracking-status');

    // Get session log
    window.electron.ipcRenderer.send('get-session-log');

    // Set up event listeners
    window.electron.ipcRenderer.on('tracking-started', (data: { sessionId: string, startTime: string }) => {
      console.log('Tracking started event received:', data);
      setIsTracking(true);
      setIsPaused(false);
      setSessionStartTime(data.startTime);
      setCurrentSessionId(data.sessionId);

      toast({
        title: "Tracking Started",
        description: `Session started at ${new Date(data.startTime).toLocaleTimeString()}`
      });

      //  Play notification sound
      const audio = new Audio("./../../assets/iphone-camera-shutter-sound.mp3"); // Replace with your sound file URL or local file
      audio.play().catch(error => console.error("Error playing sound:", error));

      new Notification("Screenshot Captured", {
        body: "A new screenshot has been saved.",
        icon: "https://via.placeholder.com/128" // Optional icon
      });

    });

    window.electron.ipcRenderer.on('tracking-paused', () => {
      console.log('Tracking paused event received');
      setIsPaused(true);

      toast({
        title: "Tracking Paused",
        description: "Your work session has been paused."
      });
    });

    window.electron.ipcRenderer.on('tracking-stopped', () => {
      console.log('Tracking stopped event received');
      setIsTracking(false);
      setIsPaused(false);
      setSessionStartTime(null);
      setCurrentSessionId(null);

      toast({
        title: "Tracking Stopped",
        description: "Your work session has ended and been saved."
      });

      // Refresh session log
      window.electron.ipcRenderer.send('get-session-log');
    });

    window.electron.ipcRenderer.on('screenshot-taken', (screenshot: Screenshot) => {
      console.log('Screenshot taken event received:', screenshot);
      setScreenshots(prev => [screenshot, ...prev].slice(0, 50));
      setLastScreenshotTime(new Date().toLocaleTimeString());

      toast({
        title: "Screenshot Captured",
        description: "A new screenshot has been saved."
      });

      // If viewing a specific session, refresh its screenshots
      if (currentSessionId) {
        window.electron.ipcRenderer.send('get-screenshots', currentSessionId);
      }
    });

    window.electron.ipcRenderer.on('tracking-status', (status: { isTracking: boolean, isPaused: boolean, currentSession: Session | null }) => {
      console.log('Tracking status received:', status);
      setIsTracking(status.isTracking);
      setIsPaused(status.isPaused);

      if (status.currentSession) {
        setSessionStartTime(status.currentSession.startTime);
        setCurrentSessionId(status.currentSession.id);
      }
    });

    window.electron.ipcRenderer.on('session-log', (sessionLog: Session[]) => {
      console.log('Session log received:', sessionLog);
      setSessions(sessionLog);
    });

    window.electron.ipcRenderer.on('screenshots', (screenshotsData: Screenshot[]) => {
      console.log('Screenshots received:', screenshotsData);
      setScreenshots(screenshotsData);
      setIsLoadingScreenshots(false);
    });

    return () => {
      if (isElectron) {
        window.electron.ipcRenderer.removeAllListeners('tracking-started');
        window.electron.ipcRenderer.removeAllListeners('tracking-paused');
        window.electron.ipcRenderer.removeAllListeners('tracking-stopped');
        window.electron.ipcRenderer.removeAllListeners('screenshot-taken');
        window.electron.ipcRenderer.removeAllListeners('tracking-status');
        window.electron.ipcRenderer.removeAllListeners('session-log');
        window.electron.ipcRenderer.removeAllListeners('screenshots');
      }
    };
  }, [isElectron, currentSessionId, toast]);

  const handleStart = () => {
    console.log('Start tracking requested');
    if (isElectron) {
      window.electron.ipcRenderer.send('start-tracking');
    } else {
      console.error('Cannot start tracking: Electron not available');
    }
  };

  const handlePause = () => {
    console.log('Pause tracking requested');
    if (isElectron) {
      window.electron.ipcRenderer.send('pause-tracking');
    } else {
      console.error('Cannot pause tracking: Electron not available');
    }
  };

  const handleStop = () => {
    console.log('Stop tracking requested');
    if (isElectron) {
      window.electron.ipcRenderer.send('stop-tracking');
    } else {
      console.error('Cannot stop tracking: Electron not available');
    }
  };

  const handleViewSession = (sessionId: string) => {
    console.log('View session requested:', sessionId);
    setCurrentSessionId(sessionId);
    setIsLoadingScreenshots(true);
    if (isElectron) {
      window.electron.ipcRenderer.send('get-screenshots', sessionId);
    } else {
      console.error('Cannot get screenshots: Electron not available');
    }
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
                  isPaused={isPaused}
                  sessionStartTime={sessionStartTime}
                  onStart={handleStart}
                  onPause={handlePause}
                  onStop={handleStop}
                />

                <ActivityStats {...activityData} />
              </div>
              <ScreenshotGallery
                screenshots={screenshots}
                isLoading={isLoadingScreenshots}
              />
            </div>

            <div className="mt-4">
              <SessionHistory
                sessions={sessions}
                onViewSession={handleViewSession}
              />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="bg-muted/40 p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <p className="text-muted-foreground">
                Detailed statistics will be available in future updates.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-4 px-4 border-t border-border">
        <div className="container mx-auto">
          <StatusBar
            isTracking={isTracking}
            isPaused={isPaused}
            lastScreenshot={lastScreenshotTime}
            inactivityTimeout={15 * 60 * 1000}
          />
        </div>
      </footer>
    </div>
  );
};

export default Index;
