import React, { useEffect, useState } from 'react';
import { Clock, X, Play, Pause, StopCircle, Camera, ChevronUp, ChevronDown } from 'lucide-react';
import { useTimeTrackerStore } from '../lib/timeTrackerStore';
import { formatDistanceToNow } from 'date-fns';

const TimeTrackerWidget: React.FC = () => {
  const {
    isTracking,
    elapsedSeconds,
    currentSession,
    lastScreenshotTime,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    updateElapsedTime,
    loadSessions
  } = useTimeTrackerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Update isCheckedIn state when currentSession changes
  useEffect(() => {
    setIsCheckedIn(currentSession !== null);
  }, [currentSession]);

  // Handle timer
  useEffect(() => {
    if (isTracking && !timer) {
      const interval = setInterval(() => {
        updateElapsedTime(elapsedSeconds + 1);
      }, 1000);
      setTimer(interval);
    } else if (!isTracking && timer) {
      clearInterval(timer);
      setTimer(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking, timer, elapsedSeconds, updateElapsedTime]);

  // Handle check-in
  const handleCheckIn = async () => {
    await startTracking(); // This automatically sets isTracking to true
    setIsOpen(true);
    setIsCheckedIn(true);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time Tracking Started', {
        body: 'Your timer has started. The system will capture random screenshots while you work.',
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Time Tracking Started', {
            body: 'Your timer has started. The system will capture random screenshots while you work.',
            icon: '/favicon.ico'
          });
        }
      });
    }
    
    // No need to manually start the timer here as the useEffect will handle it
    // when isTracking becomes true
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (timer) clearInterval(timer);
    setTimer(null);
    await stopTracking();
    setIsCheckedIn(false);
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isTracking) {
      pauseTracking();
    } else {
      resumeTracking();
      
      // Show notification when resuming
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time Tracking Resumed', {
          body: 'Your timer has resumed. The system will continue to capture random screenshots while you work.',
          icon: '/favicon.ico'
        });
      }
      
      // No need to manually start the timer here as the useEffect will handle it
      // when isTracking becomes true
    }
  };

  // Toggle widget open/closed
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed Widget with Mini Timer */}
      {!isOpen && (
        <div className="flex items-center">
          {/* Mini Timer Display - Only show when there's an active session */}
          {currentSession && (
            <div 
              className={`mr-2 px-3 py-2 rounded-lg shadow-lg ${
                isTracking ? 'bg-green-600' : 'bg-amber-500'
              } text-white font-mono flex items-center`}
            >
              {isTracking ? (
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              ) : (
                <Clock size={16} className="mr-2" />
              )}
              <span className="font-bold">{formatTime(elapsedSeconds)}</span>
              {!isTracking && <span className="ml-2 text-xs">(Paused)</span>}
            </div>
          )}
          
          {/* Quick Action Buttons - Only show when there's an active session */}
          {currentSession && (
            <div className="mr-2 flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePauseResume();
                }}
                className={`rounded-full w-10 h-10 flex items-center justify-center shadow-lg ${
                  isTracking ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                title={isTracking ? "Pause" : "Resume"}
              >
                {isTracking ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckOut();
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                title="Stop"
              >
                <StopCircle size={18} />
              </button>
            </div>
          )}
          
          {/* Main Widget Button */}
          <button
            onClick={toggleWidget}
            className="bg-[#9A00FF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#8400d6] transition-all"
            title="Time Tracker"
          >
            <Clock size={24} />
          </button>
        </div>
      )}

      {/* Expanded Widget */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-[#9A00FF] text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <Clock size={18} className="mr-2" />
              <h3 className="font-medium">Time Tracker</h3>
            </div>
            <button onClick={toggleWidget} className="text-white hover:text-gray-200">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Timer Display */}
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-[#9A00FF]">{formatTime(elapsedSeconds)}</p>
              {currentSession && (
                <p className="text-xs text-gray-500 mt-1">
                  Started {formatDistanceToNow(new Date(currentSession.startTime), { addSuffix: true })}
                </p>
              )}
              {currentSession && !isTracking && (
                <p className="text-xs text-amber-500 font-medium mt-1">
                  PAUSED
                </p>
              )}
              {currentSession && isTracking && (
                <div className="flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></div>
                  <p className="text-xs text-green-600 font-medium">
                    TIMER RUNNING
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-3 mb-4">
              {!currentSession ? (
                <button
                  onClick={handleCheckIn}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition flex items-center"
                >
                  <Play size={16} className="mr-2" />
                  Check In
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className={`${
                      isTracking ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                    } text-white px-3 py-2 rounded-lg shadow transition flex items-center`}
                  >
                    {isTracking ? (
                      <>
                        <Pause size={16} className="mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-1" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg shadow hover:bg-red-700 transition flex items-center"
                  >
                    <StopCircle size={16} className="mr-1" />
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Status Message */}
            <div className="text-center mb-4">
              {isCheckedIn && isTracking && (
                <p className="text-sm text-green-600 font-medium">
                  Timer is running
                </p>
              )}
              {isCheckedIn && !isTracking && (
                <p className="text-sm text-amber-500 font-medium">
                  Timer is paused - Click Resume to continue
                </p>
              )}
              {!isCheckedIn && (
                <p className="text-sm text-gray-500">
                  Click Check In to start tracking your time
                </p>
              )}
            </div>

            {/* Screenshot Info */}
            {currentSession && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div className="flex items-center">
                  <Camera size={14} className="text-[#9A00FF] mr-1" />
                  {lastScreenshotTime ? (
                    <span>
                      Last screenshot: {formatDistanceToNow(new Date(lastScreenshotTime), { addSuffix: true })}
                    </span>
                  ) : (
                    <span>No screenshots taken yet</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-2 text-center">
            <a
              href="/dashboard"
              className="text-xs text-[#9A00FF] hover:underline flex items-center justify-center"
            >
              Open full time tracker
              <ChevronUp size={14} className="ml-1" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackerWidget; 