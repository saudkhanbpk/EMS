import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { eachDayOfInterval, isWeekend, format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming you're using Lucide icons
import { AttendanceContext } from './AttendanceContext';
import { DownloadIcon } from 'lucide-react';

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

const EmployeeMonthlyAttendanceTable: React.FC = ({ selectedDateM }) => {
  const [attendanceData, setAttendanceData] = useState<EmployeeStats[]>([]);
  const [filteredData, setFilteredData] = useState<EmployeeStats[]>([]); // Filtered data for display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all'); // Filter state: "all", "bad", "better", "best"
    const { setAttendanceDataMonthly } = useContext(AttendanceContext);
  

  // Fetch data for the selected month
  const fetchAllEmployeesStats = async (date: Date) => {
    setLoading(true);
    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      // Fetch all attendance records for the selected month in one go
      const { data: monthlyAttendance, error: monthlyError } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('check_in', monthStart.toISOString())
        .lte('check_in', monthEnd.toISOString())
        .order('check_in', { ascending: true });

      if (monthlyError) throw monthlyError;

      // Fetch all breaks in one go
      const { data: breaks, error: breaksError } = await supabase
        .from('breaks')
        .select('*')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());

      if (breaksError) throw breaksError;

      // Fetch all absentees in one go
      const { data: absentees, error: absenteesError } = await supabase
        .from('absentees')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());
      
      if (absenteesError) throw absenteesError;

      // Calculate expected working days
      const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const workingDaysInMonth = allDaysInMonth.filter(date => !isWeekend(date)).length;

      const stats: EmployeeStats[] = await Promise.all(users.map(async (user) => {
        const { id, full_name } = user;

        // Filter attendance records for the current user
        const userAttendance = monthlyAttendance.filter(record => record.user_id === id);

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
        const workingHoursPercentage = (totalHours / (workingDaysInMonth * 8)) * 100; // Assuming 8 hours per day

        return {
          user: { id, full_name },
          presentDays,
          absentDays,
          totalHoursWorked: totalHours,
          workingHoursPercentage,
        };
      }));

      setAttendanceData(stats);
      setFilteredData(stats); // Initialize filtered data with all data
      setAttendanceDataMonthly(stats)
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError('Error fetching employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the selected date changes
  useEffect(() => {
    fetchAllEmployeesStats(selectedDateM);
  }, [selectedDateM]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    switch (filter) {
      case 'all':
        setFilteredData(attendanceData);
        break;
      case 'bad':
        setFilteredData(attendanceData.filter((entry) => entry.workingHoursPercentage < 50));
        break;
      case 'better':
        setFilteredData(attendanceData.filter((entry) => entry.workingHoursPercentage >= 50 && entry.workingHoursPercentage < 80));
        break;
      case 'best':
        setFilteredData(attendanceData.filter((entry) => entry.workingHoursPercentage >= 80));
        break;
      default:
        setFilteredData(attendanceData);
    }
  };
  
//    //Downloading Monthly Attendance of specific Employee
//  const handleDownload = async (userId: string, fullName: string) => {
//   try {
//     const monthStart = startOfMonth(selectedDateM);
//     const monthEnd = endOfMonth(selectedDateM);

//     // Fetch attendance records for the user in the current month
//     const { data: monthlyAttendance, error: attendanceError } = await supabase
//       .from('attendance_logs')
//       .select('*')
//       .eq('user_id', userId)
//       .gte('check_in', monthStart.toISOString())
//       .lte('check_in', monthEnd.toISOString())
//       .order('check_in', { ascending: true });

//     if (attendanceError) throw attendanceError;

//     // Fetch absentees for the user in the current month
//     const { data: absentees, error: absenteesError } = await supabase
//       .from('absentees')
//       .select('*')
//       .eq('user_id', userId)
//       .gte('created_at', monthStart.toISOString())
//       .lte('created_at', monthEnd.toISOString());

//     if (absenteesError) throw absenteesError;

//     // Create an array of daily attendance
//     const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
//     const dailyAttendance: DailyAttendance[] = allDaysInMonth.map(date => {
//       const dateStr = format(date, 'yyyy-MM-dd');
//       const attendance = monthlyAttendance.find(a => format(new Date(a.check_in), 'yyyy-MM-dd') === dateStr);
//       const absent = absentees.some(a => format(new Date(a.created_at), 'yyyy-MM-dd') === dateStr);

//       if (attendance) {
//         const start = new Date(attendance.check_in);
//         const end = attendance.check_out ? new Date(attendance.check_out) : new Date(start.getTime() + 4 * 60 * 60 * 1000); // Default 4 hours if no checkout
//         const workingHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
//         return {
//           date: dateStr,
//           status: 'present',
//           Check_in:attendance.check_in,
//           Check_out:attendance.check_out,
//           workingHours: Math.min(workingHours, 12), // Cap at 12 hours
//         };
//       } else if (absent) {
//         return {
//           date: dateStr,
//           status: 'absent',
//           Check_in:null,
//           Check_out:null,
//           workingHours: 0,
//         };
//       } else {
//         return {
//           date: dateStr,
//           status: 'absent',
//           Check_in:null,
//           Check_out:null,
//           workingHours: 0,
//         };
//       }
//     });

//     console.log(`Weekly Attendance for ${fullName}:`, dailyAttendance);
//     const filteredDailyAttendance = dailyAttendance.filter(entry => entry);

//     downloadPDF(filteredDailyAttendance, fullName); // Assuming you have a function to download the data as PDF
//   } catch (error) {
//     console.error('Error fetching monthly data:', error);
//     alert('Error fetching monthly data');
//   }
// };

//    //Downloading Monthly Attendance of specific Employee
const handleDownload = async (userId: string, fullName: string) => {
  try {
    const monthStart = startOfMonth(selectedDateM); // Start of the month
    const monthEnd = endOfMonth(selectedDateM); // End of the month

    // Fetch attendance records for the user in the current month
    const { data: monthlyAttendance, error: attendanceError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in', monthStart.toISOString())
      .lte('check_in', monthEnd.toISOString())
      .order('check_in', { ascending: true });

    if (attendanceError) throw attendanceError;

    // Fetch absentees for the user in the current month
    const { data: absentees, error: absenteesError } = await supabase
      .from('absentees')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    if (absenteesError) throw absenteesError;

    // Create an array of all days in the month
    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Function to format date as [25 Jul 2025 9:00 AM]
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    };

    // Process each day in the month
    const dailyAttendance = allDaysInMonth.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Find attendance record for the day
      const attendance = monthlyAttendance.find(
        (a) => format(new Date(a.check_in), 'yyyy-MM-dd') === dateStr
      );

      // Find absentee record for the day
      const absentee = absentees.find(
        (a) => format(new Date(a.created_at), 'yyyy-MM-dd') === dateStr
      );

      let status = 'Null'; // Default status
      let workmode = 'Null'; // Default work mode
      let checkIn = null;
      let checkOut = null;

      // If attendance record exists
      if (attendance) {
        status = 'Present'; // Set status to Present
        workmode = attendance.work_mode; // Set work mode from attendance
        checkIn = formatDate(new Date(attendance.check_in)); // Format check-in time
        checkOut = formatDate(new Date(attendance.check_out || new Date(new Date(checkIn).getTime() + 4 * 60 * 60 * 1000))); // Default 4 hours if no check-out
      }

      // If absentee record exists
      if (absentee) {
        if (absentee.absentee_Timing === 'Full Day' && absentee.absentee_type === 'Absent') {
          status = 'Absent'; // Override status to Absent
        } else if (absentee.absentee_Timing === 'Half Day' && absentee.absentee_type === 'Absent') {
          status = 'Half Day Absent'; // Override status to Half Day Absent
        } else if (absentee.absentee_Timing === 'Half Day' && absentee.absentee_type === 'leave') {
          status = 'Half Day Leave'; // Override status to Half Day Leave
        } else if (absentee.absentee_type === 'Sick Leave') {
          status = 'Sick Leave'; // Override status to Sick Leave
        }

        // If the employee is absent, set workmode to null
        if (status !== 'Present') {
          workmode = 'null';
        }
      }

      return {
        date: dateStr,
        status: status,
        Check_in: checkIn,
        Check_out: checkOut,
        workmode: workmode,
        fullname: fullName,
      };
    });

    console.log(`Monthly Attendance for ${fullName}:`, dailyAttendance);

    // Filter out undefined values
    const filteredDailyAttendance = dailyAttendance.filter((entry) => entry);

    // Generate and download PDF
    downloadPDF(filteredDailyAttendance, fullName);

  } catch (error) {
    console.error('Error fetching monthly data:', error);
    alert('Error fetching monthly data');
  }
};
    

//ROutr To server To download PDF
const downloadPDF = async (filteredDailyAttendance , fullName) => {    
  try {
    const response = await fetch('http://localhost:4000/generate-pdfMonthlyOfEmployee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: filteredDailyAttendance }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();

    if (blob.type !== "application/pdf") {
      throw new Error("Received incorrect file format");
    }

    const url = window.URL.createObjectURL(blob);
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `Monthly attendance_${currentDate} of ${fullName}.pdf`;

    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Open PDF manually
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};











  // Calculate counts for each category
  const totalEmployees = attendanceData.length;
  const badCount = attendanceData.filter((entry) => entry.workingHoursPercentage < 50).length;
  const betterCount = attendanceData.filter((entry) => entry.workingHoursPercentage >= 50 && entry.workingHoursPercentage < 80).length;
  const bestCount = attendanceData.filter((entry) => entry.workingHoursPercentage >= 80).length;

  return (
    <div className="flex flex-col justify-center items-center min-h-full min-w-full bg-gray-100">
      {/* Loading Animation */}
      {loading && (
        <div className="w-full max-w-5xl space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="w-full h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Filter Div */}
      {!loading && (
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center text-lg font-medium">
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex items-center space-x-2 ${
                currentFilter === 'all' ? 'font-bold' : ''
              }`}
            >
              <span className="w-4 h-4 bg-gray-600 rounded-full"></span>
              <h2 className="text-gray-600">
                Total: <span className="font-bold">{totalEmployees}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange('bad')}
              className={`flex items-center space-x-2 ${
                currentFilter === 'bad' ? 'font-bold' : ''
              }`}
            >
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
              <h2 className="text-red-600">
                Bad: <span className="font-bold">{badCount}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange('better')}
              className={`flex items-center space-x-2 ${
                currentFilter === 'better' ? 'font-bold' : ''
              }`}
            >
              <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
              <h2 className="text-yellow-600">
                Fair: <span className="font-bold">{betterCount}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange('best')}
              className={`flex items-center space-x-2 ${
                currentFilter === 'best' ? 'font-bold' : ''
              }`}
            >
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <h2 className="text-green-600">
                Good: <span className="font-bold">{bestCount}</span>
              </h2>
            </button>
          </div>
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
                {filteredData.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                    <td className="py-4 px-6">
                      <span
                        className={` ${
                          entry.workingHoursPercentage >= 80
                            ? ' text-green-500'
                            : entry.workingHoursPercentage >= 50
                            ? ' text-yellow-500'
                            : ' text-red-500'
                        }`}
                      >
                        {entry.user.full_name}
                      </span>
                    </td>
                    <td className="py-4 px-6">{entry.presentDays}</td>
                    <td className="py-4 px-6">{entry.absentDays}</td>
                    <td className="py-4 px-6">{entry.totalHoursWorked.toFixed(2)} hrs</td>
                    <td className="py-4 pl-6 max-w-fit">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          entry.workingHoursPercentage >= 80
                            ? 'bg-green-500 text-white'
                            : entry.workingHoursPercentage >= 50
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {entry.workingHoursPercentage.toFixed(2)}%
                      </span>
                    </td>
                    <button className='w-full h-full' onClick={() => handleDownload(entry.user.id, entry.user.full_name) }> 
                      <DownloadIcon className='mt-3 p-1 hover:bg-gray-300 transition-all rounded-2xl
                       text-gray-500'/></button>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No attendance records found for this month.
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

export default EmployeeMonthlyAttendanceTable;