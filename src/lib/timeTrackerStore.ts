import { create } from 'zustand';
import { supabase } from './supabase';

export interface Screenshot {
  id: string;
  timestamp: string;
  imageUrl: string;
  userId: string;
  sessionId: string;
}

export interface TimeSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  totalSeconds: number;
  isActive: boolean;
  screenshots: Screenshot[];
}

interface TimeTrackerState {
  // Current session state
  currentSession: TimeSession | null;
  isTracking: boolean;
  elapsedSeconds: number;
  lastScreenshotTime: string | null;
  screenshotInterval: number; // Fixed interval in seconds
  
  // Methods
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  pauseTracking: () => void;
  resumeTracking: () => void;
  captureScreenshot: () => Promise<void>;
  updateElapsedTime: (seconds: number) => void;
  setScreenshotInterval: (seconds: number) => void;
  
  // Session history
  sessions: TimeSession[];
  loadSessions: () => Promise<void>;
}

// Helper function to get the next screenshot delay
const getNextScreenshotDelay = (interval: number) => {
  return interval * 1000; // Convert seconds to milliseconds
};

export const useTimeTrackerStore = create<TimeTrackerState>((set, get) => ({
  currentSession: null,
  isTracking: false,
  elapsedSeconds: 0,
  lastScreenshotTime: null,
  screenshotInterval: 600, // 10 minutes in seconds
  sessions: [],
  
  startTracking: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    const sessionId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const newSession: TimeSession = {
      id: sessionId,
      userId,
      startTime,
      endTime: null,
      totalSeconds: 0,
      isActive: true,
      screenshots: []
    };
    
    // Save to database
    const { error } = await supabase
      .from('time_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        start_time: startTime,
        is_active: true
      });
    
    if (error) {
      console.error('Failed to start tracking:', error);
      return;
    }
    
    set({ 
      currentSession: newSession, 
      isTracking: true,
      elapsedSeconds: 0,
      lastScreenshotTime: null
    });
    
    // Schedule first screenshot
    setTimeout(() => {
      if (get().isTracking) {
        get().captureScreenshot();
      }
    }, getNextScreenshotDelay(get().screenshotInterval));
  },
  
  stopTracking: async () => {
    const { currentSession, elapsedSeconds } = get();
    if (!currentSession) return;
    
    const endTime = new Date().toISOString();
    
    // Update database
    const { error } = await supabase
      .from('time_sessions')
      .update({
        end_time: endTime,
        total_seconds: elapsedSeconds,
        is_active: false
      })
      .eq('id', currentSession.id);
    
    if (error) {
      console.error('Failed to stop tracking:', error);
      return;
    }
    
    const updatedSession = {
      ...currentSession,
      endTime,
      totalSeconds: elapsedSeconds,
      isActive: false
    };
    
    set(state => ({
      currentSession: null,
      isTracking: false,
      sessions: [updatedSession, ...state.sessions.filter(s => s.id !== currentSession.id)]
    }));
  },
  
  pauseTracking: () => {
    set({ isTracking: false });
  },
  
  resumeTracking: () => {
    set({ isTracking: true });
    
    // Schedule next screenshot
    setTimeout(() => {
      if (get().isTracking) {
        get().captureScreenshot();
      }
    }, getNextScreenshotDelay(get().screenshotInterval));
  },
  
  captureScreenshot: async () => {
    const { currentSession, isTracking } = get();
    if (!currentSession || !isTracking) return;
    
    try {
      // In a real implementation, you would use a native API or browser extension
      // to capture the actual screenshot. Here we're just simulating it.
      console.log('Capturing screenshot...');
      
      // Simulate screenshot capture
      const screenshotId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      // In a real app, you would upload the actual image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(`${currentSession.userId}/${screenshotId}.jpg`, new Blob(), {
          contentType: 'image/jpeg'
        });
      
      if (uploadError) {
        console.error('Failed to upload screenshot:', uploadError);
        return;
      }
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('screenshots')
        .getPublicUrl(`${currentSession.userId}/${screenshotId}.jpg`);
      
      const imageUrl = urlData?.publicUrl || '';
      
      // Save screenshot record to database
      const { error: dbError } = await supabase
        .from('screenshots')
        .insert({
          id: screenshotId,
          user_id: currentSession.userId,
          session_id: currentSession.id,
          timestamp,
          image_url: imageUrl
        });
      
      if (dbError) {
        console.error('Failed to save screenshot record:', dbError);
        return;
      }
      
      const newScreenshot: Screenshot = {
        id: screenshotId,
        timestamp,
        imageUrl,
        userId: currentSession.userId,
        sessionId: currentSession.id
      };
      
      // Update state
      set(state => ({
        lastScreenshotTime: timestamp,
        currentSession: {
          ...state.currentSession!,
          screenshots: [...state.currentSession!.screenshots, newScreenshot]
        }
      }));
      
      // Schedule next screenshot if still tracking
      if (get().isTracking) {
        setTimeout(() => {
          if (get().isTracking) {
            get().captureScreenshot();
          }
        }, getNextScreenshotDelay(get().screenshotInterval));
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  },
  
  updateElapsedTime: (seconds) => {
    set(state => ({ 
      elapsedSeconds: seconds,
      currentSession: state.currentSession 
        ? { ...state.currentSession, totalSeconds: seconds }
        : null
    }));
  },
  
  setScreenshotInterval: (seconds) => {
    set({ screenshotInterval: seconds });
  },
  
  loadSessions: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    // Load sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });
    
    if (sessionsError) {
      console.error('Failed to load sessions:', sessionsError);
      return;
    }
    
    // Load screenshots for each session
    const sessionsWithScreenshots = await Promise.all(
      sessionsData.map(async (session) => {
        const { data: screenshotsData, error: screenshotsError } = await supabase
          .from('screenshots')
          .select('*')
          .eq('session_id', session.id)
          .order('timestamp', { ascending: false });
        
        if (screenshotsError) {
          console.error('Failed to load screenshots:', screenshotsError);
          return session;
        }
        
        return {
          ...session,
          screenshots: screenshotsData.map(screenshot => ({
            id: screenshot.id,
            timestamp: screenshot.timestamp,
            imageUrl: screenshot.image_url,
            userId: screenshot.user_id,
            sessionId: screenshot.session_id
          }))
        };
      })
    );
    
    set({ sessions: sessionsWithScreenshots });
  }
})); 