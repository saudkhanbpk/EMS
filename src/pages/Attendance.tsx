import React, { useState, useEffect } from 'react';
import { format, parse, isAfter, isBefore, addMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useAuthStore, useAttendanceStore } from '../lib/store';
import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
import { Clock, Coffee, Calendar, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';



const OFFICE_LATITUDE = 34.1299;
const OFFICE_LONGITUDE = 72.4656;
const GEOFENCE_RADIUS = 0.5; // km

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  work_mode: 'on_site' | 'remote';
  status: string;
}

interface BreakRecord {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string | null;
}

type ViewType = 'daily' | 'weekly' | 'monthly';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Attendance: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const initializeUser = useAuthStore((state) => state.initializeUser); 
  // console.log("User  id 1:" , user.user.id);
  // console.log("User id 2 :" , user.id);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const { 
    isCheckedIn, 
    checkInTime, 
    isOnBreak, 
    breakStartTime, 
    workMode,
    setCheckIn,
    setBreakTime,
    setWorkMode,
    setIsCheckedIn,
    setIsOnBreak
  } = useAttendanceStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [breakRecords, setBreakRecords] = useState<Record<string, BreakRecord[]>>({});
  const [isDisabled, setIsDisabled] = useState(false);

// Checking Today Leave For the User , If the User is Leave For Today , then Disable Its Checkin Button
  useEffect(() => {
    
    const loadCurrentAttendance = async () => {
      if (!user ) return;
      // || !isCheckedIn
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Updated query to get the most recent unchecked-out attendance
        const { data, error } = await withRetry(() => 
          supabase
            .from('attendance_logs')
            .select('id, check_in, check_out')
            .eq('user_id', localStorage.getItem('user_id'))
            .gte('check_in', startOfDay.toISOString())
            .lte('check_in', endOfDay.toISOString())
            .is('check_out', null)
            .order('check_in', { ascending: false })
            .limit(1)
            .single()
        );

        if (error) {
          if (error.code !== 'PGRST116') { // If no record exists, it's okay
            console.error('Error loading current attendance:', error);
          }
          return;
        }
  
        if (data) {
  
          if (data.check_out === null) {
            // User has an active session (not checked out)
            setIsCheckedIn(true);
            setAttendanceId(data.id);
            setCheckIn(data.check_in)
          } else {
            // User has checked out
            setIsCheckedIn(false);
          }
        } else {
          // No record found means user is not checked in
          setIsCheckedIn(false);
          console.log('No attendance record found');
        }
      } catch (err) {
        console.error('Error in loadCurrentAttendance:', err);
        setError(handleSupabaseError(err));
      }
    };
  
    loadCurrentAttendance();
  }, [user]);



// Checking Today Leave For the User , If the User is Leave For Today , then Disable Its Checkin Button
  const checkAbsenteeStatus = async () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];      

    const { data, error } = await supabase
      .from("absentees")
      .select("absentee_type, absentee_date")
      .eq("user_id", localStorage.getItem('user_id'))
      .eq("absentee_type", "leave")
      .eq("absentee_date", today);

    if (error) {
      console.error("Error fetching absentee data:", error);
      return;
    }
    console.log("Data from absentees" , data);
    

    // If there's at least one record, disable the button
    if (data.length > 0) {
      setIsDisabled(true);
    }
  };

  checkAbsenteeStatus();





  const loadAttendanceRecords = async () => {
    if (!user) return;
  
    try {
      let startDate, endDate;
  
      switch (view) {
        case 'daily':
          startDate = format(selectedDate, 'yyyy-MM-dd');
          endDate = format(addMinutes(new Date(startDate), 24 * 60 - 1), 'yyyy-MM-dd');
          break;
        case 'weekly':
          startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
          endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
          break;
        case 'monthly':
          startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
          endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
          break;
      }
  
      const { data: records, error: recordsError } = await withRetry(() => 
        supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', localStorage.getItem('user_id'))
          .gte('check_in', `${startDate}T00:00:00Z`) // Corrected here
          .lt('check_in', `${endDate}T23:59:59Z`)  // Corrected here
          .order('check_in', { ascending: false })
      );
    
  
      if (recordsError) throw recordsError;
  
      if (records && records.length > 0) {
        setAttendanceRecords(records);
  
        // Use the most recent attendance record to determine break status
        const latestRecord = records[0];
  
        // Load break records only for the latest attendance record
        const { data: breaks, error: breaksError }: { data: BreakRecord[], error: any } = await withRetry(() =>
          supabase
            .from('breaks')
            .select('*')
            .eq('attendance_id', latestRecord.id)
            .order('start_time', { ascending: true })
        );
        
        if (breaksError) throw breaksError;
        
        const breakData: Record<string, BreakRecord[]> = {};
        if (breaks) {
          breakData[latestRecord.id] = breaks;
          
          // Check the last break for this attendance record
          const previousBreak = breaks[breaks.length - 1];
          if (previousBreak) {
            if (!previousBreak.end_time) {
              // If the last break has no end_time, user is still on break.
              setIsOnBreak(true);
              setBreakTime(previousBreak.start_time); // Record when the break started
            } else {
              // Otherwise, user is not on break.
              setIsOnBreak(false);
              setBreakTime(null);
            }
          } else {
            // If no breaks exist for this attendance record, user is not on break.
            setIsOnBreak(false);
            setBreakTime(null);
          }
        } else {
          // No break data for the latest attendance record
          setIsOnBreak(false);
          setBreakTime(null);
        }
        
        setBreakRecords(breakData);
      } else {
        // No attendance records found for the period
        setAttendanceRecords([]);
        setBreakRecords({});
        setIsOnBreak(false);
        setBreakTime(null);
      }
    } catch (err) {
      console.error('Error loading attendance records:', err);
      setError(handleSupabaseError(err));
    }
  };
  
  useEffect(() => {
    loadAttendanceRecords();
  }, [user, view, selectedDate]);
  


  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  getCurrentLocation()
  .then((position)=>{
    // console.log(position.coords.latitude);
    // console.log(position.coords.longitude);
    
  }).catch(()=>{
    console.log("User Location Undefined");
    
  })


  const handleCheckIn = async () => {
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      

      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
    
      setCurrentLocation({ lat: latitude, lng: longitude });
      
      const now = new Date();
      const checkInTimeLimit = parse('09:30', 'HH:mm', now);
 
      let attendanceStatus = 'present';
      if (isAfter(now, checkInTimeLimit)) {
        attendanceStatus = 'late';
      }

      const distance = calculateDistance(latitude, longitude, OFFICE_LATITUDE, OFFICE_LONGITUDE);
      const mode = distance <= GEOFENCE_RADIUS ? 'on_site' : 'remote';

      const { data, error: dbError }: { data: AttendanceRecord, error: any } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .insert([
            {
              user_id: localStorage.getItem('user_id'),
              check_in: now.toISOString(),
              work_mode: mode,
              latitude,
              longitude,
              status: attendanceStatus
            }
          ])
          .select()
          .single()
      );
      


    // Putting Half Day For Employee Checkin if the Checkin is After 11 am
      //  const checkInTime = now.getHours() * 60 + now.getMinutes(); // Convert time to minutes
      //  const cutoffTime = 11 * 60; // 11:00 AM in minutes
      //  if (checkInTime > cutoffTime) {
      //    await withRetry(() =>
      //             supabase.from('absentees')
      //          .insert([{
      //          user_id: localStorage.getItem('user_id'),
      //          absentee_type: 'Absent',
      //          absentee_Timing: 'Half Day',
      //        }
      //      ])
      //    );
      //  }
      

      if (dbError) throw dbError;

      setIsCheckedIn(true);
      setCheckIn(now.toISOString());
      setWorkMode(mode);
      setAttendanceId(data.id);
      await loadAttendanceRecords();
    } catch (err) {      
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !attendanceId) {
      setError('No active attendance record found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();

      // First, end any ongoing breaks
      if (isOnBreak) {
        const { error: breakError }: { error: any } = await withRetry(() =>
          supabase
            .from('breaks')
            .update({ 
              end_time: now.toISOString(),
              status: 'on_time'
            })
            .eq('attendance_id', attendanceId)
            .is('end_time', null)
        );

        if (breakError) throw breakError;

        setIsOnBreak(false);
        setBreakTime(null);
      }

      // Then update the attendance record with check-out time
      const { error: dbError }: { error: any } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .update({ 
            check_out: now.toISOString()
          })
          .eq('id', attendanceId)
          .is('check_out', null)
      );

      if (dbError) throw dbError;

      // Reset all states
      setIsCheckedIn(false);
      setCheckIn(null);
      setWorkMode(null);
      setAttendanceId(null);

      // Reload attendance records to show the updated data
      await loadAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = async () => {
    if (!attendanceId) {
      setError('No active attendance record found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const breakEndLimit = parse('14:10', 'HH:mm', now);
      
      if (!isOnBreak) {
        // Starting break
        const { error: dbError } = await withRetry(() =>
          supabase
            .from('breaks')
            .insert([
              {
                attendance_id: attendanceId,
                start_time: now.toISOString(),
                status: 'on_time'
              }
            ])
        );

        if (dbError) throw dbError;

        setIsOnBreak(true);
        setBreakTime(now.toISOString());
      } else {
        // Ending break
        let breakStatus = 'on_time';
        if (isAfter(now, breakEndLimit)) {
          breakStatus = 'late';
        }

        const { error: dbError } = await withRetry(() =>
          supabase
            .from('breaks')
            .update({ 
              end_time: now.toISOString(),
              status: breakStatus
            })
            .eq('attendance_id', attendanceId)
            .is('end_time', null)
        );

        if (dbError) throw dbError;

        setIsOnBreak(false);
        setBreakTime(null);
      }
      await loadAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderAttendanceRecords = () => {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Attendance Records</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('daily')}
                className={`px-3 py-1 rounded-lg ${
                  view === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`px-3 py-1 rounded-lg ${
                  view === 'weekly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-3 py-1 rounded-lg ${
                  view === 'monthly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedDate(prev => {
                switch (view) {
                  case 'daily':
                    return addMinutes(prev, -24 * 60);
                  case 'weekly':
                    return addMinutes(prev, -7 * 24 * 60);
                  case 'monthly':
                    return addMinutes(prev, -30 * 24 * 60);
                }
              })}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium">
              {format(selectedDate, view === 'daily' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(prev => {
                switch (view) {
                  case 'daily':
                    return addMinutes(prev, 24 * 60);
                  case 'weekly':
                    return addMinutes(prev, 7 * 24 * 60);
                  case 'monthly':
                    return addMinutes(prev, 30 * 24 * 60);
                }
              })}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breaks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.check_in), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.check_in), 'hh:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.work_mode === 'on_site'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {record.work_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {breakRecords[record.id]?.map((breakRecord, index) => (
                        <div key={breakRecord.id} className="mb-1">
                          <span className="text-gray-600">Break {index + 1}: </span>
                          {format(new Date(breakRecord.start_time), 'hh:mm a')}
                          {breakRecord.end_time && (
                            <> - {format(new Date(breakRecord.end_time), 'hh:mm a')}</>
                          )}
                          {breakRecord.status && (
                            <span className={`ml-2 px-2 text-xs rounded-full ${
                              breakRecord.status === 'on_time'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {breakRecord.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Check-in Status</h2>
            </div>
            {workMode && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                workMode === 'on_site' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {workMode === 'on_site' ? 'On-site' : 'Remote'}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}


          {isDisabled && <span className="text-red-600 p-2 ">You are on Leave Today</span>}


          {isCheckedIn ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Checked in at: {checkInTime && format(new Date(checkInTime), 'hh:mm a')}
              </p>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                {loading ? 'Checking out...' : 'Check Out'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading || isDisabled} // Button is disabled if loading or if the condition is met
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Checking in...' : 'Check In'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Coffee className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Break Time</h2>
          </div>

          {isCheckedIn && (
            <>
              {breakStartTime && (
                <p className="text-gray-600 mb-4">
                  Break started at: {format(new Date(breakStartTime), 'hh:mm a')}
                </p>
              )}
              
              <button
                onClick={handleBreak}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isOnBreak
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                } disabled:opacity-50`}
              >
                {loading ? 'Updating...' : isOnBreak ? 'End Break' : 'Start Break'}
              </button>
            </>
          )}
        </div>
      </div>

      {renderAttendanceRecords()}
    </div>
  );
};

export default Attendance;