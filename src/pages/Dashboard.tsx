import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval, isWeekend, eachDayOfInterval } from 'date-fns';
import { useAuthStore } from '../lib/store';
import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
import { Clock, Calendar, AlertCircle, Coffee, MapPin, User, BarChart, LogOut } from 'lucide-react';
import AbsenteeComponent from './AbsenteesData';
import DashboardCards from '../components/DashboardCards';
import DailyStatusTable from '../components/DailyStatusTable';
import BreakRecordsTable from '../components/BreakRecordTable';
import MonthlyRecord from '../components/MonthlyRecords';



interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  work_mode: 'on_site' | 'remote';
  status: string;
  latitude: number;
  longitude: number;
}

interface BreakRecord {
  start_time: string;
  end_time: string | null;
  status: string | null;
}

interface UserProfile {
  full_name: string;
  department: string | null;
}

interface MonthlyStats {
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  onSiteDays: number;
  remoteDays: number;
  averageWorkHours: number;
  expectedWorkingDays: number;
}


const Dashboard: React.FC = ({ isSmallScreen, isSidebarOpen }) => {
  // const user = useAuthStore((state) => state.user);
  const sessionData = localStorage.getItem('supabaseSession');
  const session = sessionData ? JSON.parse(sessionData) : null;
  const user = session?.user;

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [todayBreak, setTodayBreak] = useState<BreakRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [absentees, setabsentees] = useState('');
  const [leaves, setleaves] = useState('');
  const navigate = useNavigate();


  const userID = localStorage.getItem('user_id')
  useEffect(() => {
    const fetchleaves = async () => {
      const { count, error } = await supabase
        .from("absentees")
        .select("*", { count: "exact", head: true })
        .eq('user_id', userID)
        .eq('absentee_type', "leave")
      if (error) {
        console.error("Error Fetching Absentees Count", error);
      } else {
        console.log("absentees Count :", count);
        if (count > 0) {
          setleaves(count)
        } else {
          setleaves(0)
        }
      }
    }
    fetchleaves();
  }, [userID])


  useEffect(() => {
    const fetchabsentees = async () => {
      const { count, error } = await supabase
        .from("absentees")
        .select("*", { count: "exact", head: true })
        .eq('user_id', userID)
        .eq('absentee_type', "Absent")
      if (error) {
        console.error("Error Fetching Absentees Count", error);
      } else {
        console.log("absentees Count :", count);
        if (count > 0) {
          setabsentees(count)
        } else {
          setabsentees(0)
        }
      }
    }
    fetchabsentees();
  }, [userID])



  useEffect(() => {

    const loadTodayData = async () => {

      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Load user profile with retry mechanism
        const { data: profileData, error: profileError } = await withRetry(() =>
          supabase
            .from('users')
            .select('full_name, department')
            .eq('id', user.id)
            .single()
        );


        if (profileError) throw profileError;
        if (profileData) setUserProfile(profileData);

        // Get today's date in the correct format
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Get today's attendance
        const { data: attendanceData, error: attendanceError } = await withRetry(() =>
          supabase
            .from('attendance_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('check_in', startOfDay.toISOString())
            .lte('check_in', endOfDay.toISOString())
            .order('check_in', { ascending: false })
            .limit(1)
            .single()
        );

        if (attendanceError && attendanceError.code !== 'PGRST116') throw attendanceError;

        if (attendanceData) {
          setTodayAttendance(attendanceData);

          // Get break records if checked in
          const { data: breakData, error: breakError } = await withRetry(() =>
            supabase
              .from('breaks')
              .select('*')
              .eq('attendance_id', attendanceData.id)
            // .order('date', { ascending: true })

          );

          if (breakError) throw breakError;
          if (breakData) setTodayBreak(breakData);
        }







        // Load monthly statistics
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        // Calculate expected working days (excluding weekends)
        const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const workingDaysInMonth = allDaysInMonth.filter(date => !isWeekend(date)).length;

        const { data: monthlyAttendance, error: monthlyError } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('check_in', monthStart.toISOString())
          .lte('check_in', monthEnd.toISOString())
          .order('check_in', { ascending: true });

        if (monthlyError) throw monthlyError;

        if (monthlyAttendance) {
          // Group attendance by date to avoid counting multiple check-ins on the same day
          const attendanceByDate = monthlyAttendance.reduce((acc, curr) => {
            const date = format(new Date(curr.check_in), 'yyyy-MM-dd');
            if (!acc[date] || new Date(curr.check_in) < new Date(acc[date].check_in)) {
              acc[date] = curr;
            }
            return acc;
          }, {} as Record<string, AttendanceRecord>);

          const uniqueAttendance = Object.values(attendanceByDate);

          const stats: MonthlyStats = {
            expectedWorkingDays: workingDaysInMonth,
            totalWorkingDays: uniqueAttendance.length,
            presentDays: uniqueAttendance.filter(a => a.status === 'present').length,
            lateDays: uniqueAttendance.filter(a => a.status === 'late').length,
            onSiteDays: uniqueAttendance.filter(a => a.work_mode === 'on_site').length,
            remoteDays: uniqueAttendance.filter(a => a.work_mode === 'remote').length,
            averageWorkHours: 0
          };

          // // Calculate average work hours
          // let totalHours = 0;
          // uniqueAttendance.forEach(attendance => {
          //   const start = new Date(attendance.check_in);
          //   const end = attendance.check_out
          //    ? new Date(attendance.check_out)
          //    : new Date(start.getTime() + 4 * 60 * 60 * 1000); // Adds 4 hours
          //   const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          //   totalHours += Math.min(hours, 12); // Cap at 24 hours to avoid outliers
          // });

          let totalHours = 0;

          uniqueAttendance.forEach(attendance => {
            const start = new Date(attendance.check_in);
            // If an employee has no CheckOut, assign 4 working hours
            const end = attendance.check_out
              ? new Date(attendance.check_out)
              : new Date(start.getTime() + 4 * 60 * 60 * 1000); // Adds 4 hours

            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            totalHours += Math.min(hours, 12);
          });

          // Fetch all breaks related to this attendance
          const { data: breaks, error: breaksError } = await supabase
            .from("breaks")
            .select("start_time, end_time")
            .in("attendance_id", uniqueAttendance.map(a => a.id));

          if (breaksError) throw breaksError;

          let totalBreakHours = 0;

          breaks.forEach(breakEntry => {
            const breakStart = new Date(breakEntry.start_time);
            const breakEnd = breakEntry.end_time
              ? new Date(breakEntry.end_time)
              : new Date(breakStart.getTime() + 1 * 60 * 60 * 1000); // Default 1-hour break

            const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
            totalBreakHours += Math.min(breakHours, 12);
          });

          // Subtract break hours from total work hours
          totalHours -= totalBreakHours;




          stats.averageWorkHours = totalHours / uniqueAttendance.length;

          setMonthlyStats(stats);
        }




      } catch (err) {
        console.error('Error in loadTodayData:', err);
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    };

    loadTodayData();
    const interval = setInterval(loadTodayData, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) {
      end = new Date().toISOString();
    }
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getTotalBreakDuration = () => {
    let totalMinutes = 0;
    todayBreak.forEach(breakRecord => {
      if (breakRecord.end_time) {
        const start = new Date(breakRecord.start_time);
        const end = new Date(breakRecord.end_time);
        totalMinutes += Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return totalMinutes > 0 ? `${hours}h ${minutes}m` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto  px-4 py-8'>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (


    <div className='max-w-7xl mx-auto  px-4 py-8'>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {userProfile?.full_name || 'Employee'}
          </h1>
          {userProfile?.department && (
            <p className="text-gray-600 mt-1">Department: {userProfile.department}</p>
          )}
        </div>
        <div className='text-right'>
          <select name="view" id="view" className='w-[134px] h-[40px] rounded-[8px] border py-1 px-2  border-[#D0D5DD]'>
            <option value="Table view">Table View</option>
            <option value="graph view">Graph View</option>
          </select>
        </div>

      </div>
      <div className="flex justify-end">
        <p className="font-inter font-medium text-base text-[#000000] leading-7 ">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p> &nbsp; &nbsp;
        <p className="font-inter font-medium text-base text-[#000000] leading-7  ">{format(new Date(), 'h:mm a')}</p>
      </div>
      <DashboardCards
      />
      <div className='mb-16'>
        <DailyStatusTable />

      </div>
      <div className='mb-16'>
        <BreakRecordsTable />
      </div>
      <div className='mb-10'>
        <MonthlyRecord />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Status Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Today's Status</h2>
            </div>
            {todayAttendance && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${todayAttendance.status === 'present'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {todayAttendance.status}
              </span>
            )}
          </div>

          {todayAttendance ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in/out Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Attendance Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">
                        {format(new Date(todayAttendance.check_in), 'h:mm a')}
                      </span>
                    </div>
                    {todayAttendance.check_out && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">
                          {format(new Date(todayAttendance.check_out), 'h:mm a')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Work Mode:</span>
                      <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${todayAttendance.work_mode === 'on_site'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                        }`}>
                        {todayAttendance.work_mode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-sm">
                        {todayAttendance.latitude.toFixed(4)}, {todayAttendance.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Duration */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Work Duration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Time:</span>
                      <span className="font-medium">
                        {calculateDuration(todayAttendance.check_in, todayAttendance.check_out)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Break Time:</span>
                      <span className="font-medium">
                        {getTotalBreakDuration() || '0h 0m'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${!todayAttendance.check_out
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {!todayAttendance.check_out ? 'Working' : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Break Records */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Break Records</h3>
                {todayBreak.length > 0 ? (
                  <div className="space-y-3">
                    {todayBreak.map((breakRecord, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Coffee className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Break {index + 1}:</span>
                          <span className="ml-2">
                            {format(new Date(breakRecord.start_time), 'h:mm a')}
                            {breakRecord.end_time && (
                              <> - {format(new Date(breakRecord.end_time), 'h:mm a')}</>
                            )}
                          </span>
                        </div>
                        {breakRecord.status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${breakRecord.status === 'on_time'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {breakRecord.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No breaks taken today</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-600">Not checked in yet</p>
                <p className="text-sm text-gray-500 mt-1">Check in from the Attendance page to start your day</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Quick Stats</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Today's Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">
                    {todayAttendance
                      ? format(new Date(todayAttendance.check_in), 'h:mm a')
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">
                    {todayAttendance?.check_out
                      ? format(new Date(todayAttendance.check_out), 'h:mm a')
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Latest Break:</span>
                  <span className="font-medium">
                    {todayBreak.length > 0
                      ? format(new Date(todayBreak[todayBreak.length - 1].start_time), 'h:mm a')
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Work Mode:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${todayAttendance?.work_mode === 'on_site'
                    ? 'bg-blue-100 text-blue-800'
                    : todayAttendance?.work_mode === 'remote'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {todayAttendance?.work_mode || 'Not Set'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Break Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Breaks:</span>
                  <span className="font-medium">{todayBreak.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Break Duration:</span>
                  <span className="font-medium">
                    {getTotalBreakDuration() || '0h 0m'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Overview Card */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <BarChart className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Monthly Overview - {format(new Date(), 'MMMM yyyy')}</h2>
          </div>

          {monthlyStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Attendance Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expected Working Days:</span>
                    <span className="font-medium">{monthlyStats.expectedWorkingDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Days Attended:</span>
                    <span className="font-medium">{monthlyStats.totalWorkingDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Present Days:</span>
                    <span className="font-medium text-green-600">{monthlyStats.presentDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Late Days:</span>
                    <span className="font-medium text-yellow-600">{monthlyStats.lateDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Absentees:</span>
                    <span className="font-medium text-red-600">{absentees}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Leaves:</span>
                    <span className="font-medium text-green-600">{leaves}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Work Mode Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">On-site Days:</span>
                    <span className="font-medium text-blue-600">{monthlyStats.onSiteDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Remote Days:</span>
                    <span className="font-medium text-purple-600">{monthlyStats.remoteDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Attendance Rate:</span>
                    <span className="font-medium">
                      {((monthlyStats.totalWorkingDays / monthlyStats.expectedWorkingDays) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Work Hours</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Daily Hours:</span>
                    <span className="font-medium">
                      {monthlyStats.averageWorkHours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">
                      {(monthlyStats.averageWorkHours * monthlyStats.totalWorkingDays).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Expected Hours:</span>
                    <span className="font-medium">
                      {(7 * monthlyStats.expectedWorkingDays)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this month
            </div>
          )}
        </div>

        {/* Absentees Details */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <BarChart className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Absentees Details- {format(new Date(), 'MMMM yyyy')}</h2>
          </div>

          <div>
            {/* Absentee Data Div */}
            <AbsenteeComponent />
          </div>


        </div>

      </div>
    </div>
  );
};

export default Dashboard;