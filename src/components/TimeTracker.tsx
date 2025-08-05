import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  Clock,
  Camera,
  History,
  AlertCircle,
} from 'lucide-react';
import { useTimeTrackerStore, Screenshot } from '../lib/timeTrackerStore';
import { formatDistanceToNow, format } from 'date-fns';



const TimeTracker: React.FC = () => {
  const {
    isTracking,
    elapsedSeconds,
    currentSession,
    lastScreenshotTime,
    sessions,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    updateElapsedTime,
    loadSessions,
  } = useTimeTrackerStore();

  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
    await startTracking();
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (timer) clearInterval(timer);
    setTimer(null);
    await stopTracking();
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isTracking) {
      pauseTracking();
    } else {
      resumeTracking();
    }
  };

  // Toggle session details
  const toggleSessionDetails = (sessionId: string) => {
    if (selectedSession === sessionId) {
      setSelectedSession(null);
    } else {
      setSelectedSession(sessionId);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Time Tracker</h2>

      {/* Current Session */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="text-[#9A00FF] mr-2" size={24} />
            <h3 className="text-xl font-semibold">Current Session</h3>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <History size={18} className="mr-1" />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 mb-1">Elapsed Time</p>
              <p className="text-4xl font-bold text-[#9A00FF]">
                {formatTime(elapsedSeconds)}
              </p>
              {currentSession && (
                <p className="text-sm text-gray-500 mt-1">
                  Started{' '}
                  {formatDistanceToNow(new Date(currentSession.startTime), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>

            <div className="mt-4 md:mt-0">
              {!currentSession ? (
                <button
                  onClick={handleCheckIn}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition flex items-center"
                >
                  <Play size={18} className="mr-2" />
                  Check In
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handlePauseResume}
                    className={`${
                      isTracking
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white px-4 py-2 rounded-lg shadow transition flex items-center`}
                  >
                    {isTracking ? (
                      <>
                        <Pause size={18} className="mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={18} className="mr-2" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition flex items-center"
                  >
                    <StopCircle size={18} className="mr-2" />
                    Check Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {currentSession && (
            <div>
              <div className="flex items-center mb-2">
                <Camera className="text-[#9A00FF] mr-2" size={18} />
                <p className="text-gray-600">
                  {lastScreenshotTime
                    ? `Last screenshot taken ${formatDistanceToNow(
                        new Date(lastScreenshotTime),
                        { addSuffix: true }
                      )}`
                    : 'No screenshots taken yet'}
                </p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <AlertCircle size={16} className="mr-2" />
                <p>Screenshots are taken randomly while you're working</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      {showHistory && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Session History</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No previous sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div
                    className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleSessionDetails(session.id)}
                  >
                    <div>
                      <p className="font-medium">
                        {format(new Date(session.startTime), 'MMM d, yyyy')} -{' '}
                        {formatTime(session.totalSeconds)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(session.startTime), 'h:mm a')} -{' '}
                        {session.endTime
                          ? format(new Date(session.endTime), 'h:mm a')
                          : 'In progress'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Camera size={16} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">
                        {session.screenshots.length}
                      </span>
                    </div>
                  </div>

                  {selectedSession === session.id && (
                    <div className="p-4 bg-white">
                      <h4 className="font-medium mb-2">
                        Screenshots ({session.screenshots.length})
                      </h4>
                      {session.screenshots.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No screenshots for this session.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {session.screenshots.map((screenshot: Screenshot) => (
                            <div key={screenshot.id} className="relative group">
                              <img
                                src={
                                  screenshot.imageUrl ||
                                  '/placeholder-screenshot.jpg'
                                }
                                alt={`Screenshot at ${format(
                                  new Date(screenshot.timestamp),
                                  'h:mm:ss a'
                                )}`}
                                className="w-full h-24 object-cover rounded border border-gray-200"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b">
                                {format(
                                  new Date(screenshot.timestamp),
                                  'h:mm:ss a'
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
