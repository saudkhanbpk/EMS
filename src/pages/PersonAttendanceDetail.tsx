import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { X, Clock, Coffee, Calendar } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface PersonAttendanceDetailProps {
  userId: string;
  userName: string;
  selectedMonth: Date;
  onClose: () => void;
}

interface AttendanceDetailRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakTime: number; // in hours
  workedHours: number; // in hours
  status: string;
  workMode: string;
}

const PersonAttendanceDetail: React.FC<PersonAttendanceDetailProps> = ({
  userId,
  userName,
  selectedMonth,
  onClose,
}) => {
  const [attendanceDetails, setAttendanceDetails] = useState<
    AttendanceDetailRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceDetails();
  }, [userId, selectedMonth]);

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      // Fetch attendance records for the user in the selected month
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('check_in', monthStart.toISOString())
        .lte('check_in', monthEnd.toISOString())
        .order('check_in', { ascending: true });

      if (attendanceError) throw attendanceError;
      console.log('Attandence Recordds', attendanceRecords);

      // Fetch breaks for the user in the selected month
      const { data: breaks, error: breaksError } = await supabase
        .from('breaks')
        .select('*')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());

      if (breaksError) throw breaksError;

      // Fetch absentees for the user in the selected month
      const { data: absentees, error: absenteesError } = await supabase
        .from('absentees')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());
      if (absenteesError) throw absenteesError;

      // Fetch holidays
      const { data: holidays, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .eq('organization_id', userProfile?.organization_id);

      if (holidaysError) throw holidaysError;

      // Get all days in the month (excluding weekends and future dates)
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today

      const allDaysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      }).filter((date) => {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Exclude weekends

        // Only show today and past dates
        return date <= today;
      });

      // Create a list to collect all daily statuses (optional)
      const statuses: string[] = [];

      // Process each day
      const dailyDetails: AttendanceDetailRecord[] = allDaysInMonth.map(
        (date) => {
          const dateStr = format(date, 'yyyy-MM-dd');

          // Find attendance record for this date
          const attendance = attendanceRecords?.find(
            (record) =>
              format(new Date(record.check_in), 'yyyy-MM-dd') === dateStr
          );

          // Find absentee record for this date
          const absentee = absentees?.find(
            (record) =>
              format(new Date(record.created_at), 'yyyy-MM-dd') === dateStr
          );

          // Check if this date is a holiday
          const isHoliday = holidays?.some((holiday) =>
            holiday.dates?.some(
              (holidayDate: string) =>
                format(new Date(holidayDate), 'yyyy-MM-dd') === dateStr
            )
          );

          let checkIn: string | null = null;
          let checkOut: string | null = null;
          let status = isHoliday ? 'Holiday' : 'Absent';
          let workMode = 'N/A';
          let workedHours = 0;
          let breakTime = 0;

          if (attendance) {
            checkIn = format(new Date(attendance.check_in), 'h:mm a');
            checkOut = attendance.check_out
              ? format(new Date(attendance.check_out), 'h:mm a')
              : null;
            status = attendance.status || 'Present';
            workMode = attendance.work_mode || 'N/A';

            // Calculate worked hours
            if (attendance.check_out) {
              const start = new Date(attendance.check_in);
              const end = new Date(attendance.check_out);
              workedHours =
                (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }

            // Calculate break time for this attendance record
            const attendanceBreaks =
              breaks?.filter(
                (breakRecord) => breakRecord.attendance_id === attendance.id
              ) || [];

            breakTime = attendanceBreaks.reduce((total, breakRecord) => {
              if (breakRecord.start_time && breakRecord.end_time) {
                const breakStart = new Date(breakRecord.start_time);
                const breakEnd = new Date(breakRecord.end_time);
                const breakDuration =
                  (breakEnd.getTime() - breakStart.getTime()) /
                  (1000 * 60 * 60);
                return total + breakDuration;
              }
              return total;
            }, 0);

            // Subtract break time from worked hours
            workedHours = Math.max(0, workedHours - breakTime);
          } else if (absentee) {
            if (absentee.absentee_type === 'leave') {
              status = 'Leave';
            } else if (absentee.absentee_type === 'Sick Leave') {
              status = 'Sick Leave';
            } else {
              status = 'Absent';
            }
          }

          // ✅ Optional: collect all statuses
          statuses.push(status);

          return {
            date: dateStr,
            checkIn,
            checkOut,
            breakTime,
            workedHours,
            status,
            workMode,
          };
        }
      );

      console.log('All daily statuses:', statuses.length);

      setAttendanceDetails(dailyDetails);
    } catch (err) {
      console.error('Error fetching attendance details:', err);
      setError('Failed to fetch attendance details');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'text-green-600 bg-green-100';
      case 'late':
        return 'text-yellow-600 bg-yellow-100';
      case 'absent':
        return 'text-red-600 bg-red-100';
      case 'leave':
      case 'sick leave':
        return 'text-blue-600 bg-blue-100';
      case 'holiday':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black border border-pink-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
            <p className="text-gray-600">
              Attendance Details - {format(selectedMonth, 'MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center py-8">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Break Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worked Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Mode
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceDetails.map((record, index) => (
                    <tr
                      key={record.date}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkIn ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-green-500" />
                            {record.checkIn}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOut ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-red-500" />
                            {record.checkOut}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.breakTime > 0 ? (
                          <div className="flex items-center">
                            <Coffee className="w-4 h-4 mr-2 text-orange-500" />
                            {formatHours(record.breakTime)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.workedHours > 0 ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            {formatHours(record.workedHours)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            record.workMode === 'remote'
                              ? 'bg-purple-100 text-purple-800'
                              : record.workMode === 'on_site'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.workMode === 'on_site'
                            ? 'On-site'
                            : record.workMode === 'remote'
                            ? 'Remote'
                            : record.workMode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonAttendanceDetail;
