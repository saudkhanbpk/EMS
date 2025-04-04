import React, { useEffect, useState } from 'react';
import { Clock, User, Camera, ChevronDown, ChevronUp, Calendar, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface EmployeeSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string | null;
  totalSeconds: number;
  isActive: boolean;
  screenshotCount: number;
}

interface Screenshot {
  id: string;
  timestamp: string;
  imageUrl: string;
  userId: string;
  sessionId: string;
}

const TimeTrackerAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<EmployeeSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, Screenshot[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load sessions for the selected date
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const startDate = startOfDay(parseISO(selectedDate)).toISOString();
        const endDate = endOfDay(parseISO(selectedDate)).toISOString();

        // Get all sessions for the selected date
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('time_sessions')
          .select(`
            id,
            user_id,
            start_time,
            end_time,
            total_seconds,
            is_active,
            users (
              email,
              user_metadata
            )
          `)
          .gte('start_time', startDate)
          .lte('start_time', endDate)
          .order('start_time', { ascending: false });

        if (sessionsError) {
          console.error('Error loading sessions:', sessionsError);
          return;
        }

        // Get screenshot counts for each session
        const sessionIds = sessionsData?.map(session => session.id) || [];
        
        // Using a different approach to get screenshot counts
        const screenshotCounts: Record<string, number> = {};
        
        if (sessionIds.length > 0) {
          // For each session, count its screenshots
          for (const sessionId of sessionIds) {
            const { data: countData, error: countError } = await supabase
              .from('screenshots')
              .select('id', { count: 'exact' })
              .eq('session_id', sessionId);
              
            if (countError) {
              console.error(`Error counting screenshots for session ${sessionId}:`, countError);
            } else {
              screenshotCounts[sessionId] = countData?.length || 0;
            }
          }
        }

        // Map sessions to our format
        const formattedSessions: EmployeeSession[] = sessionsData?.map(session => {
          return {
            id: session.id,
            userId: session.user_id,
            userName: session.users?.user_metadata?.name || 'Unknown',
            userEmail: session.users?.email || 'No email',
            startTime: session.start_time,
            endTime: session.end_time,
            totalSeconds: session.total_seconds,
            isActive: session.is_active,
            screenshotCount: screenshotCounts[session.id] || 0
          };
        }) || [];

        setSessions(formattedSessions);
      } catch (error) {
        console.error('Error in loadSessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [selectedDate]);

  // Load screenshots for a session when expanded
  const loadScreenshots = async (sessionId: string) => {
    if (screenshots[sessionId]) return; // Already loaded

    try {
      const { data, error } = await supabase
        .from('screenshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading screenshots:', error);
        return;
      }

      const formattedScreenshots: Screenshot[] = data?.map(screenshot => ({
        id: screenshot.id,
        timestamp: screenshot.timestamp,
        imageUrl: screenshot.image_url,
        userId: screenshot.user_id,
        sessionId: screenshot.session_id
      })) || [];

      setScreenshots(prev => ({
        ...prev,
        [sessionId]: formattedScreenshots
      }));
    } catch (error) {
      console.error('Error in loadScreenshots:', error);
    }
  };

  // Toggle session expansion
  const toggleSession = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      loadScreenshots(sessionId);
    }
  };

  // Filter sessions by search term
  const filteredSessions = sessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.userName.toLowerCase().includes(searchLower) ||
      session.userEmail.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Employee Time Tracking</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Calendar className="text-gray-400 mr-2" size={20} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64"
          />
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9A00FF] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No sessions found for the selected date.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="border rounded-lg overflow-hidden">
              <div
                className={`p-4 cursor-pointer ${
                  expandedSession === session.id ? 'bg-gray-100' : 'bg-gray-50'
                }`}
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center mb-2 md:mb-0">
                    <div className="bg-[#9A00FF] text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{session.userName}</p>
                      <p className="text-sm text-gray-500">{session.userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{formatTime(session.totalSeconds)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className={`font-medium ${session.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {session.isActive ? 'Active' : 'Completed'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Camera size={16} className="text-gray-400 mr-1" />
                      <span className="text-sm">{session.screenshotCount}</span>
                      {expandedSession === session.id ? (
                        <ChevronUp size={18} className="ml-2 text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="ml-2 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              {expandedSession === session.id && (
                <div className="p-4 bg-white border-t">
                  <div className="mb-3 flex justify-between items-center">
                    <h4 className="font-medium">Screenshots</h4>
                    <div className="text-sm text-gray-500">
                      {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')} - 
                      {session.endTime 
                        ? ` ${format(new Date(session.endTime), 'h:mm a')}`
                        : ' In progress'}
                    </div>
                  </div>
                  
                  {!screenshots[session.id] ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A00FF] mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading screenshots...</p>
                    </div>
                  ) : screenshots[session.id].length === 0 ? (
                    <p className="text-gray-500 text-sm py-2">No screenshots available for this session.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {screenshots[session.id].map((screenshot) => (
                        <div key={screenshot.id} className="relative group">
                          <img
                            src={screenshot.imageUrl || '/placeholder-screenshot.jpg'}
                            alt={`Screenshot at ${format(new Date(screenshot.timestamp), 'h:mm:ss a')}`}
                            className="w-full h-32 object-cover rounded border border-gray-200"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b">
                            {format(new Date(screenshot.timestamp), 'h:mm:ss a')}
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
  );
};

export default TimeTrackerAdmin; 