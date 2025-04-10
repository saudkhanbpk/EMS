import React, { useEffect, useState } from 'react';
import { Clock, X, Users, Camera, ChevronUp, AlertCircle, User, RefreshCw, Calendar, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ActiveEmployee {
  id: string;
  name: string;
  email: string;
  startTime: string;
  elapsedTime: string;
  screenshotCount: number;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string | null;
  elapsedTime: string;
  isActive: boolean;
  screenshotCount: number;
}

interface UserSummary {
  userId: string;
  name: string;
  email: string;
  totalSessions: number;
  totalTime: string;
  totalScreenshots: number;
  lastActive: string | null;
}

type ViewMode = 'active' | 'all' | 'summary';

const TimeTrackerAdminWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [allSessions, setAllSessions] = useState<UserSession[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHoursToday, setTotalHoursToday] = useState('00:00');
  const [totalScreenshots, setTotalScreenshots] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  // Load active sessions
  useEffect(() => {
    loadActiveSessions();
    // Set up a refresh interval when widget is open
    let interval: NodeJS.Timeout | null = null;
    if (isOpen) {
      interval = setInterval(() => {
        loadActiveSessions();
        if (viewMode === 'all' || viewMode === 'summary') {
          loadAllSessions();
        }
      }, 30000); // Refresh every 30 seconds when open
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, viewMode, dateFilter]);

  // Also set up a background refresh interval for the mini display
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        loadActiveSessions();
      }
    }, 60000); // Refresh every minute when closed
    return () => clearInterval(interval);
  }, [isOpen]);

  // Load all sessions when view mode changes or date filter changes
  useEffect(() => {
    if (viewMode === 'all' || viewMode === 'summary') {
      loadAllSessions();
    }
  }, [viewMode, dateFilter]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load active sessions
  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      // Get all active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('time_sessions')
        .select(`
          id,
          user_id,
          start_time,
          total_seconds,
          users (
            email,
            user_metadata
          )
        `)
        .eq('is_active', true)
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
        return;
      }

      // Get screenshot counts for each session
      const sessionIds = sessionsData?.map(session => session.id) || [];
      const screenshotCounts: Record<string, number> = {};

      let totalScreenshotsCount = 0;
      let totalSeconds = 0;

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
            totalScreenshotsCount += countData?.length || 0;
          }
        }
      }

      // Map sessions to our format
      const formattedEmployees: ActiveEmployee[] = sessionsData?.map(session => {
        totalSeconds += session.total_seconds || 0;
        return {
          id: session.id,
          name: session.users?.user_metadata?.name || 'Unknown',
          email: session.users?.email || 'No email',
          startTime: session.start_time,
          elapsedTime: formatTime(session.total_seconds || 0),
          screenshotCount: screenshotCounts[session.id] || 0
        };
      }) || [];

      setActiveEmployees(formattedEmployees);
      setTotalScreenshots(totalScreenshotsCount);
      setLastRefresh(new Date());
      // Format total hours
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setTotalHoursToday(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Error in loadActiveSessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all sessions for the selected date
  const loadAllSessions = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(new Date(dateFilter)).toISOString();
      const endDate = endOfDay(new Date(dateFilter)).toISOString();

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
        console.error('Error loading all sessions:', sessionsError);
        return;
      }

      // Get screenshot counts for each session
      const sessionIds = sessionsData?.map(session => session.id) || [];
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
      const formattedSessions: UserSession[] = sessionsData?.map(session => {
        return {
          id: session.id,
          userId: session.user_id,
          userName: session.users?.user_metadata?.name || 'Unknown',
          userEmail: session.users?.email || 'No email',
          startTime: session.start_time,
          endTime: session.end_time,
          elapsedTime: formatTime(session.total_seconds || 0),
          isActive: session.is_active,
          screenshotCount: screenshotCounts[session.id] || 0
        };
      }) || [];

      setAllSessions(formattedSessions);

      // Generate user summaries
      const userMap = new Map<string, UserSummary>();
      formattedSessions.forEach(session => {
        if (!userMap.has(session.userId)) {
          userMap.set(session.userId, {
            userId: session.userId,
            name: session.userName,
            email: session.userEmail,
            totalSessions: 0,
            totalTime: '00:00:00',
            totalScreenshots: 0,
            lastActive: null
          });
        }

        const userSummary = userMap.get(session.userId)!;
        userSummary.totalSessions += 1;
        userSummary.totalScreenshots += session.screenshotCount;

        // Calculate total time
        const currentTotalSeconds = userSummary.totalTime.split(':').reduce((acc, time, index) => {
          return acc + parseInt(time) * Math.pow(60, 2 - index);
        }, 0);

        const sessionSeconds = session.elapsedTime.split(':').reduce((acc, time, index) => {
          return acc + parseInt(time) * Math.pow(60, 2 - index);
        }, 0);

        userSummary.totalTime = formatTime(currentTotalSeconds + sessionSeconds);

        // Update last active time
        if (!userSummary.lastActive || new Date(session.startTime) > new Date(userSummary.lastActive)) {
          userSummary.lastActive = session.startTime;
        }
      });
      setUserSummaries(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error in loadAllSessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle widget open/closed
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    loadActiveSessions();
    if (viewMode === 'all' || viewMode === 'summary') {
      loadAllSessions();
    }
  };

  // Filter sessions by search term
  const filteredSessions = allSessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.userName.toLowerCase().includes(searchLower) ||
      session.userEmail.toLowerCase().includes(searchLower)
    );
  });

  // Filter user summaries by search term
  const filteredSummaries = userSummaries.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Set date to yesterday
  const setYesterday = () => {
    setDateFilter(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  };

  // Set date to today
  const setToday = () => {
    setDateFilter(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed Widget with Mini Status */}
      {!isOpen && (
        <div className="flex items-center">
          {/* Mini Status Display */}
          <div className="mr-2 px-3 py-2 rounded-lg shadow-lg bg-[#9A00FF] text-white flex items-center">
            <div className="flex items-center mr-3">
              <User size={14} className="mr-1" />
              <span className="font-bold">{activeEmployees.length}</span>
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span className="font-bold">{totalHoursToday}</span>
            </div>
          </div>
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow-lg mr-2"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          {/* Main Widget Button */}
          <button
            onClick={toggleWidget}
            className="bg-[#9A00FF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#8400d6] transition-all"
            title="Time Tracking Monitor"
          >
            <Users size={24} />
          </button>
        </div>
      )}

      {/* Expanded Widget */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden transition-all">
          {/* Header */}
          <div className="bg-[#9A00FF] text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <h3 className="font-medium">Time Tracking Monitor</h3>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleRefresh}
                className="text-white hover:text-gray-200 mr-2"
                title="Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={toggleWidget}
                className="text-white hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500">Active Employees</p>
              <p className="text-xl font-bold text-[#9A00FF]">{activeEmployees.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Hours Today</p>
              <p className="text-xl font-bold text-[#9A00FF]">{totalHoursToday}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Screenshots</p>
              <p className="text-xl font-bold text-[#9A00FF]">{totalScreenshots}</p>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 text-sm font-medium ${viewMode === 'active'
                  ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setViewMode('active')}
            >
              Active Now
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${viewMode === 'all'
                  ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setViewMode('all')}
            >
              All Sessions
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${viewMode === 'summary'
                  ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setViewMode('summary')}
            >
              User Summary
            </button>
          </div>

          {/* Filters */}
          {(viewMode === 'all' || viewMode === 'summary') && (
            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-2" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={setYesterday}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                >
                  Yesterday
                </button>
                <button
                  onClick={setToday}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                >
                  Today
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          {(viewMode === 'all' || viewMode === 'summary') && (
            <div className="p-3 bg-gray-50 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded-md w-full text-sm"
                />
              </div>
            </div>
          )}

          {/* Content based on view mode */}
          <div className="max-h-80 overflow-y-auto">
            {/* Active Employees View */}
            {viewMode === 'active' && (
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Currently Active</h4>
                  <p className="text-xs text-gray-500">
                    Last updated: {format(lastRefresh, 'h:mm a')}
                  </p>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9A00FF]"></div>
                  </div>
                ) : activeEmployees.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <AlertCircle size={18} className="mx-auto mb-2" />
                    No active employees at the moment
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEmployees.map((employee) => (
                      <div key={employee.id} className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#9A00FF] text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{employee.elapsedTime}</p>
                            <div className="flex items-center justify-end text-xs text-gray-500">
                              <Camera size={12} className="mr-1" />
                              {employee.screenshotCount}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Started at {format(new Date(employee.startTime), 'h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Sessions View */}
            {viewMode === 'all' && (
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">All Sessions for {format(new Date(dateFilter), 'MMM d, yyyy')}</h4>
                  <p className="text-xs text-gray-500">
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9A00FF]"></div>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <AlertCircle size={18} className="mx-auto mb-2" />
                    No sessions found for this date
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => (
                      <div key={session.id} className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`${session.isActive ? 'bg-green-600' : 'bg-gray-500'} text-white rounded-full w-8 h-8 flex items-center justify-center mr-2`}>
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{session.userName}</p>
                              <p className="text-xs text-gray-500">{session.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{session.elapsedTime}</p>
                            <div className="flex items-center justify-end text-xs text-gray-500">
                              <Camera size={12} className="mr-1" />
                              {session.screenshotCount}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex justify-between">
                          <span>
                            {format(new Date(session.startTime), 'h:mm a')} -
                            {session.endTime ? format(new Date(session.endTime), ' h:mm a') : ' In progress'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-white ${session.isActive ? 'bg-green-600' : 'bg-gray-500'}`}>
                            {session.isActive ? 'Active' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Summary View */}
            {viewMode === 'summary' && (
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">User Summary for {format(new Date(dateFilter), 'MMM d, yyyy')}</h4>
                  <p className="text-xs text-gray-500">
                    {filteredSummaries.length} user{filteredSummaries.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9A00FF]"></div>
                  </div>
                ) : filteredSummaries.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <AlertCircle size={18} className="mx-auto mb-2" />
                    No users found for this date
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSummaries.map((user) => (
                      <div key={user.userId} className="bg-white border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#9A00FF] text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.totalTime}</p>
                            <div className="flex items-center justify-end text-xs text-gray-500">
                              <Camera size={12} className="mr-1" />
                              {user.totalScreenshots}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium">{user.totalSessions}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-500">Last Active</p>
                            <p className="font-medium">
                              {user.lastActive ? format(new Date(user.lastActive), 'h:mm a') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-2 text-center">
            <a
              href="/admin-dashboard"
              className="text-xs text-[#9A00FF] hover:underline flex items-center justify-center"
            >
              Open full monitoring dashboard
              <ChevronUp size={14} className="ml-1" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackerAdminWidget;
