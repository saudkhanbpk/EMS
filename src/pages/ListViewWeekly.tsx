import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming you're using Lucide icons

interface User {
  id: string;
  full_name: string;
  // Add other user fields as needed
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: string; // ISO 8601 timestamp
  check_out: string | null; // ISO 8601 timestamp
  status: string;
  work_mode: string;
}

interface EmployeeStats {
  user: User;
  presentDays: number;
  absentDays: number;
  totalHoursWorked: number;
  workingHoursPercentage: number;
}

const EmployeeWeeklyAttendanceTable: React.FC = ({selectedDateW}) => {
  const [attendanceData, setAttendanceData] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
//   const [selectedDateW, setSelectedDateW] = useState(new Date()); // Default to current date

  // Fetch data for the selected week
  const fetchAllEmployeesStats = async (date: Date) => {
    setLoading(true);
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start of the week (Monday)
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // End of the week (Sunday)

      // Fetch all attendance records for the selected week in one go
      const { data: weeklyAttendance, error: weeklyError } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('check_in', weekStart.toISOString())
        .lte('check_in', weekEnd.toISOString())
        .order('check_in', { ascending: true });

      if (weeklyError) throw weeklyError;

      // Fetch all breaks in one go
      const { data: breaks, error: breaksError } = await supabase
        .from('breaks')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (breaksError) throw breaksError;

      // Fetch all absentees in one go
      const { data: absentees, error: absenteesError } = await supabase
        .from('absentees')
        .select('*')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (absenteesError) throw absenteesError;

      // Calculate expected working days
      const allDaysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const workingDaysInWeek = allDaysInWeek.filter(date => !isWeekend(date)).length;

      const stats: EmployeeStats[] = await Promise.all(users.map(async (user) => {
        const { id, full_name } = user;

        // Filter attendance records for the current user
        const userAttendance = weeklyAttendance.filter(record => record.user_id === id);

        // Calculate unique attendance days
        const attendanceByDate = userAttendance.reduce((acc, curr) => {
          const date = format(new Date(curr.check_in), 'yyyy-MM-dd');
          if (!acc[date] || new Date(curr.check_in) < new Date(acc[date].check_in)) {
            acc[date] = curr;
          }
          return acc;
        }, {} as Record<string, AttendanceRecord>);

        const uniqueAttendance: AttendanceRecord[] = Object.values(attendanceByDate);

        // Calculate total working hours
        let totalHours = 0;

        uniqueAttendance.forEach(attendance => {
          const start = new Date(attendance.check_in);
          const end = attendance.check_out 
            ? new Date(attendance.check_out) 
            : new Date(start.getTime() + 4 * 60 * 60 * 1000); // Default 4 hours if no checkout

          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          totalHours += Math.min(hours, 12); // Cap at 12 hours per day
        });

        // Calculate total break hours for the user
        const userBreaks = breaks.filter(breakEntry => uniqueAttendance.some(a => a.id === breakEntry.attendance_id));
        let totalBreakHours = 0;

        userBreaks.forEach(breakEntry => {
          const breakStart = new Date(breakEntry.start_time);
          const breakEnd = breakEntry.end_time 
            ? new Date(breakEntry.end_time) 
            : new Date(breakStart.getTime() + 1 * 60 * 60 * 1000); // Default 1-hour break

          const breakHours = (breakEnd - breakStart) / (1000 * 60 * 60);
          totalBreakHours += Math.min(breakHours, 12); // Cap at 12 hours per break
        });

        totalHours -= totalBreakHours;

        // Calculate absent days
        const userAbsentees = absentees.filter(absentee => absentee.user_id === id);
        const leavesCount = userAbsentees.filter(absentee => absentee.absentee_type === 'leave').length;
        const absenteesCount = userAbsentees.filter(absentee => absentee.absentee_type === 'Absent').length;

        const presentDays = uniqueAttendance.filter(a => a.status === 'present' || 'late').length;
        const absentDays = leavesCount + absenteesCount;

        // Calculate working hours percentage
        const workingHoursPercentage = (totalHours / (workingDaysInWeek * 8)) * 100; // Assuming 8 hours per day

        return {
          user: { id, full_name },
          presentDays,
          absentDays,
          totalHoursWorked: totalHours,
          workingHoursPercentage,
        };
      }));

      setAttendanceData(stats);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError('Error fetching employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the selected date changes
  useEffect(() => {
    fetchAllEmployeesStats(selectedDateW);
  }, [selectedDateW]);

//   // Handle week change (previous/next)
//   const handleWeekChange = (direction: 'prev' | 'next') => {
//     setSelectedDate((prevDate) =>
//       direction === 'prev' ? addWeeks(prevDate, -1) : addWeeks(prevDate, 1)
//     );
//   };

  return (
    <div className="flex flex-col justify-center items-center min-h-full min-w-full bg-gray-100 p-0">
      {/* Heading */}

      {/* Week Navigation */}
      {/* <div className="flex items-center justify-center my-4">
        <button
          onClick={() => handleWeekChange('prev')}
          className="p-2 hover:bg-gray-200 rounded-full transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="mx-4 text-xl font-semibold">
          {format(selectedDate, 'MMMM yyyy')} (Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')})
        </span>
        <button
          onClick={() => handleWeekChange('next')}
          className="p-2 hover:bg-gray-200 rounded-full transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div> */}

      {/* Loading Animation */}
      {loading && (
        <div className="w-full max-w-5xl space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="w-full h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Attendance Table */}
      {!loading && (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 text-gray-700 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Employee Name</th>
                  <th className="py-3 px-6 text-left">Present Days</th>
                  <th className="py-3 px-6 text-left">Absent Days</th>
                  <th className="py-3 px-6 text-left">Total Hours Worked</th>
                  <th className="py-3 px-6 text-left">Working Hours %</th>
                </tr>
              </thead>
              <tbody className="text-md font-normal">
                {attendanceData.map((entry, index) => {
                  const percentageColor =
                    entry.workingHoursPercentage < 70
                      ? 'bg-red-500 text-white'
                      : entry.workingHoursPercentage >= 70 && entry.workingHoursPercentage < 80
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-500 text-white';

                  const nameColor =
                    entry.workingHoursPercentage < 70
                      ? 'text-red-500'
                      : 'text-gray-800';

                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className={`py-4 px-6 ${nameColor}`}>{entry.user.full_name}</td>
                      <td className="py-4 px-6">{entry.presentDays}</td>
                      <td className="py-4 px-6">{entry.absentDays}</td>
                      <td className="py-4 px-6">{entry.totalHoursWorked.toFixed(2)} hrs</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${percentageColor}`}
                        >
                          {entry.workingHoursPercentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {attendanceData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No attendance records found for this week.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWeeklyAttendanceTable;