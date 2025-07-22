import React, { useState, useEffect } from 'react';
import { parse, isAfter, isBefore, addMinutes, setMinutes, setHours, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { useAuthStore, useAttendanceStore } from '../lib/store';
import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
import timeImage from './../assets/Time.png'
import teaImage from './../assets/Tea.png'
import { Clock, Coffee, Calendar, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { toZonedTime, format } from 'date-fns-tz';
import { error } from 'console';
import { useUser } from '../contexts/UserContext';

const GEOFENCE_RADIUS = 0.15; // km - increased from 0.15km to 1km for better tolerance

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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Attendance: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const initializeUser = useAuthStore((state) => state.initializeUser);
  const { userProfile } = useUser();
  const [officeLocation, setOfficeLocation] = useState({ latitude: 0, longitude: 0 });
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Fetch office location from the database
  useEffect(() => {
    const fetchOfficeLocation = async () => {
      if (!userProfile?.organization_id) return;

      setIsLocationLoading(true);
      try {
        const { data, error } = await supabase
          .from('Location')
          .select('latitude, longitude')
          .eq('organization_id', userProfile.organization_id)
          .single();

        if (error) {
          console.error('Error fetching office location:', error);
          return;
        }

        if (data) {
          console.warn("office fetched successfully", data)
          setOfficeLocation({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude)
          });
        }
      } catch (err) {
        console.error('Error fetching office location:', err);
      } finally {
        setIsLocationLoading(false);
      }
    };

    fetchOfficeLocation();
  }, [userProfile?.organization_id]);

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
  const [, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [breakRecords, setBreakRecords] = useState<Record<string, BreakRecord[]>>({});
  const [isDisabled, setIsDisabled] = useState(false);
  const [isButtonLoading, setisButtonLoading] = useState(false);
  const [alreadycheckedin, setalreadycheckedin] = useState(false)
  const [alreadybreak, setalreadybreak] = useState<boolean>(false)
  const [isbreak, setisbreak] = useState<boolean>(true);



  // Checking Today Leave For the User , If the User is Leave For Today , then Disable Its Checkin Button
  useEffect(() => {

    const loadCurrentAttendance = async () => {
      if (!user) return;
      // || !isCheckedIn
      try {
        setisButtonLoading(true)
        setalreadycheckedin(false)
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
            // .is('check_out', null)
            .order('check_in', { ascending: false })
            .limit(1)
            .single()
        );

        if (error) {
          setisButtonLoading(false)

          if (error.code !== 'PGRST116') { // If no record exists, it's okay
            console.error('Error loading current attendance:', error);
          }
          return;
        }

        if (data) {
          setisButtonLoading(false)

          // if (data.check_in) { setalreadycheckedin(true) }
          if (data.check_in && localStorage.getItem("user_id") !== "759960d6-9ada-4dcc-b385-9e2da0a862be") {
            setalreadycheckedin(true);
          }
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
  }, []);



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
    // console.log("Data from absentees" , data);


    // If there's at least one record, disable the button
    if (data.length > 0) {
      setIsDisabled(true);
    }
  };



  const fetchAttendanceStatus = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Checking whether the user has already checked in today
      const { data, error } = await withRetry(() =>
        supabase
          .from('extrahours')
          .select('id, check_in, check_out')
          .eq('user_id', localStorage.getItem('user_id'))
          .gte('check_in', startOfDay.toISOString())
          .lte('check_in', endOfDay.toISOString())
          .is('check_out', null)
          .order('check_in', { ascending: false })
      );

      if (error) {
        if (error.code !== 'PGRST116') { // Ignore "no record found" errors
          console.error('Error loading current attendance:', error);
        }
        return;
      }

      // If there are any active sessions (check_out is null), disable the check-in button
      if (data && data.length > 0) {
        console.log('Active extrahours session found. Disabling check-in button.');
        setIsDisabled(true);
      } else {
        setIsDisabled(false);
      }
    } catch (error) {
      console.log('Error checking extrahours status:', error);
    }
  }


  useEffect(() => {
    const runSequentialChecks = async () => {
      await fetchAttendanceStatus();  // Check for active extrahours sessions
      await checkAbsenteeStatus();    // Check for leave status
    };

    runSequentialChecks();
  }, [user]);







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
              setalreadybreak(true)
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
        setisbreak(false)
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
    .then((position) => {
      // console.log(position.coords.latitude);
      // console.log(position.coords.longitude);

    }).catch(() => {
      console.log("User Location Undefined");

    })

  //Handle Check in
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


      // Use server time for check_in
      // Insert without check_in, let Supabase use default now()
      console.log('User location:', { latitude, longitude });
      console.log('Office location:', officeLocation);

      const distance = calculateDistance(latitude, longitude, officeLocation.latitude, officeLocation.longitude);
      console.log('Distance from office:', distance, 'km');
      console.log('Geofence radius:', GEOFENCE_RADIUS, 'km');

      // Determine work mode based on distance from office
      const workMode = distance <= GEOFENCE_RADIUS ? 'on_site' : 'remote';

      // Calculate status based on current time in Pakistan (Asia/Karachi)
      const nowInPakistan = toZonedTime(new Date(), 'Asia/Karachi');
      const nineThirty = new Date(nowInPakistan);
      nineThirty.setHours(9, 30, 0, 0);
      const status = nowInPakistan > nineThirty ? 'late' : 'present';

      // If outside office location, prompt for remote check-in confirmation
      if (workMode === 'remote') {
        const confirmRemote = window.confirm(
          "Your check-in will be counted as Remote because you are currently outside the office zone. If you don't have approval for remote work, you will be marked Absent. Do you want to proceed with remote check-in?"
        );

        if (!confirmRemote) {
          console.log("Remote check-in aborted by user.");
          setLoading(false);
          return;
        }
      }

      // Insert attendance record, let Supabase set check_in to now()
      const { data, error: dbError } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .insert([
            {
              user_id: localStorage.getItem('user_id'),
              // check_in: not set, let server use now()
              work_mode: workMode,
              latitude,
              longitude,
              status, // calculated based on time in Pakistan
            }
          ])
          .select()
          .single()
      );



      if (dbError) throw dbError;

      setIsCheckedIn(true);
      setCheckIn(data.check_in); // Use the value returned from the server
      setWorkMode(workMode);
      setAttendanceId(data.id);
      await loadAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }


  const handleCheckOut = async () => {
    if (!user || !attendanceId) {
      setError('No active attendance record found');
      return;
    }

    try {
      const userConfirmed = confirm("You are about to check out. Please confirm your action.");
      if (!userConfirmed) {
        console.log("User canceled the action.");
        return; // User canceled, exit the function early
      }

      setLoading(true);
      setError(null);

      const now = new Date();

      // First, end any ongoing breaks
      if (isOnBreak) {
        const { error: breakError } = await withRetry(() =>
          supabase
            .from('breaks')
            .update({
              end_time: now.toISOString(),
              status: 'on_time',

              ending: "auto"
            })
            .eq('attendance_id', attendanceId)
            .is('end_time', null)
        );

        if (breakError) throw breakError;

        setIsOnBreak(false);
        setBreakTime(null);
      }

      // Checking the Total Time in Office; If it is less than 6 hrs then put half-day in absentees database
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      // 1️⃣ Check if there is already an attendance record for the user today
      const { data: attendanceData, error: attendanceError } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .select('check_in, check_out, created_at')
          .eq('user_id', localStorage.getItem('user_id'))
          .filter('created_at', 'gte', `${todayDate}T00:00:00+00`) // Filter records from the start of today
          .filter('created_at', 'lte', `${todayDate}T23:59:59+00`) // Filter records until the end of today
      );

      if (attendanceError) throw attendanceError;

      // If both check_in and check_out exist for today, skip further actions
      if (attendanceData.length > 0 && attendanceData[0].check_in && attendanceData[0].check_out) {
        console.log("Both check-in and check-out available for today. No further action needed.");
        setLoading(false);
        return;
      }

      // Then update the attendance record with check-out time
      const { error: dbError } = await withRetry(() =>
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

      console.log("Today's Date:", todayDate);
      console.log("Attendance Data:", attendanceData);

      // 2️⃣ Calculate total attendance duration (in hours)
      const { data: checkInData, error: checkInError } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .select('check_in')
          .eq('user_id', localStorage.getItem('user_id'))
          .filter('created_at', 'gte', `${todayDate}T00:00:00+00`) // Filter records from the start of today
          .filter('created_at', 'lte', `${todayDate}T23:59:59+00`) // Filter records until the end of today
          .limit(1)
          .single()
      );

      if (checkInError) throw checkInError;

      const checkInTime = new Date(checkInData.check_in);
      const checkOutTime = new Date(now.toISOString());

      // Calculate total attendance duration (in hours)
      const attendanceDuration = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert ms to hours
      console.log(`Attendance duration: ${attendanceDuration.toFixed(2)} hours`);

      // If attendance duration is sufficient, skip further actions
      if (attendanceDuration >= 4) {
        console.log("Attendance is sufficient. No further action needed.");
        return;
      }

      // 3️⃣ Check if the user has a leave record for today
      const { data: absenteeData, error: absenteeError } = await supabase
        .from('absentees')
        .select('id')
        .eq('user_id', localStorage.getItem('user_id'))
        .eq('absentee_date', todayDate);

      if (absenteeError) {
        console.error("Error checking absentee records:", absenteeError);
        return;
      }

      // If a leave record exists, skip further actions
      if (absenteeData.length > 0) {
        console.log("User is on leave today. No action needed.");
        return;
      }

      // 4️⃣ If no leave record exists, mark as "Half-Day Absent"
      const { error: insertError } = await supabase
        .from('absentees')
        .insert([{
          user_id: localStorage.getItem('user_id'),
          absentee_date: todayDate,
          absentee_type: 'Absent',
          absentee_Timing: 'Half Day',
        }]);

      if (insertError) {
        console.error("Error inserting half-day absent record:", insertError);
      } else {
        console.log("Half-day absent record added successfully.");
      }

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
              {/* <Calendar className="w-6 h-6 text-blue-600" /> */}
              <h2 className="text-xl font-semibold">
                Monthly Overview - &nbsp;
                {
                  format(selectedDate, 'MMMM yyyy')
                }
              </h2>
            </div>
            <select className="text-sm rounded-lg px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={view}
              onChange={(e) => setView(e.target.value as ViewType)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>


            {/* <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('daily')}
                className={`px-3 py-1 rounded-lg ${view === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`px-3 py-1 rounded-lg ${view === 'weekly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-3 py-1 rounded-lg ${view === 'monthly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Monthly
              </button>
            </div> */}
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
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-semibold text-xl leading-5 text-[#344054]">
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
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border-2 border-[#F5F5F9]">
              <thead>
                <tr className=" text-gray-700 text-sm">
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Date</th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Check In</th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Check Out</th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Status</th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Work Mode</th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Breaks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 border whitespace-nowrap  tex-[#666666] text-xs leading-5 font-normal">
                      {format(new Date(record.check_in), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 border whitespace-nowrap  tex-[#666666] text-xs leading-5 font-normal">
                      {format(new Date(record.check_in), 'hh:mm a')}
                    </td>
                    <td className="px-6 py-4 border whitespace-nowrap text-xs leading-5 font-normal tex-[#666666]">
                      {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 border whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 border whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.work_mode === 'on_site'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                        }`}>
                        {record.work_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 border whitespace-nowrap text-sm text-gray-500">
                      {breakRecords[record.id]?.map((breakRecord, index) => (
                        <div key={breakRecord.id} className="mb-1">
                          <span className="text-gray-600">Break {index + 1}: </span>
                          {format(new Date(breakRecord.start_time), 'hh:mm a')}
                          {breakRecord.end_time && (
                            <> - {format(new Date(breakRecord.end_time), 'hh:mm a')}</>
                          )}
                          {breakRecord.status && (
                            <span className={`ml-2 px-2 text-xs rounded-full ${breakRecord.status === 'on_time'
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

      <div className="grid grid-cols-1 md:grid-cols-2 mb-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img src={timeImage} alt="clock" className='w-8 h-8' />&nbsp;&nbsp;
              {/* <Clock className="w-6 h-6 text-blue-600 mr-2" /> */}
              <h2 className="text-[22px] leading-7 text-[#000000] font-semibold">Check-in Status</h2>
            </div>
            {workMode && (
              <span className={`px-3 py-1 rounded-full text-sm ${workMode === 'on_site' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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


          {isDisabled && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have an active extra hours session. Please check out from there before checking in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCheckedIn ? (
            <div className="space-y-4">
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#FF2828] text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                {loading ? 'Checking out...' : 'Check Out'}
              </button>
              <p className="text-[#7B7E85] font-medium text-[13px] leading-7">
                Checked in at: {checkInTime && format(new Date(checkInTime), 'hh:mm a')}
              </p>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading || isDisabled || alreadycheckedin || isButtonLoading || isLocationLoading} // Also disable if location is still loading
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Checking in...' : isLocationLoading ? 'Loading location...' : 'Check In'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <img src={teaImage} alt="teaImage" className='w-8 h-8' /> &nbsp;&nbsp;
            {/* <Coffee className="w-6 h-6 text-blue-600 mr-2" /> */}
            <h2 className="text-[22px] leading-7 text-[#000000] font-semibold">Break Time</h2>
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
                disabled={loading || isbreak || alreadybreak}
                className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOnBreak
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-[#9A00FF] text-white hover:bg-[#9A00FF] focus:ring-[#9A00FF]'
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
}

export default Attendance;