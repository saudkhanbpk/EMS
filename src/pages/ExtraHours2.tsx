import React, { useState, useEffect } from "react";
import {
  format,
  parse,
  isAfter,
  isBefore,
  addMinutes,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { useAuthStore, useAttendanceStore } from "../lib/store";
import { supabase, withRetry, handleSupabaseError } from "../lib/supabase";
import timeImage from "./../assets/Time.png";
import teaImage from "./../assets/Tea.png";
import calendarImage from "./../assets/calendar.png";
import {
  Clock,
  Coffee,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const OFFICE_LATITUDE = 34.1299;
const OFFICE_LONGITUDE = 72.4656;
const GEOFENCE_RADIUS = 0.5; // km

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  work_mode: "on_site" | "remote";
  status: string;
}

interface BreakRecord {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string | null;
}

type ViewType = "daily" | "weekly" | "monthly";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ExtraHours: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const initializeUser = useAuthStore((state) => state.initializeUser);
  // console.log("User  id 1:" , user.user.id);
  // console.log("User id 2 :" , user.id);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const {
    isRemoteCheckedIn,
    RemotecheckInTime,
    isOnRemoteBreak,
    RemotebreakStartTime,
    RemoteworkMode,
    setRemoteCheckIn,
    setRemoteBreakTime,
    setRemoteWorkMode,
    setIsRemoteCheckedIn,
    setIsOnRemoteBreak,
  } = useAttendanceStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrenRemotetLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [RemoteattendanceId, setRemoteAttendanceId] = useState<string | null>(
    null
  );
  const [Remoteview, setRemoteView] = useState<ViewType>("daily");
  const [selectedRemoteDate, setSelectedRemoteDate] = useState(new Date());
  const [RemoteattendanceRecords, setRemoteAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [RemotebreakRecords, setRemoteBreakRecords] = useState<
    Record<string, BreakRecord[]>
  >({});
  const [isRemoteDisabled, setIsRemoteDisabled] = useState(false);

  useEffect(() => {
    const fetchAttendanceStatus = async () => {
      if (!user) return;

      try {
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0
        );
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59
        );

        // Checking whether the user has already checked in today
        const { data, error } = await withRetry(() =>
          supabase
            .from("attendance_logs")
            .select("id, check_in, check_out")
            .eq("user_id", localStorage.getItem("user_id"))
            .gte("check_in", startOfDay.toISOString())
            .lte("check_in", endOfDay.toISOString())
            .is("check_out", null)
            .order("check_in", { ascending: false })
            .limit(1)
            .single()
        );

        if (error) {
          if (error.code !== "PGRST116") {
            // Ignore "no record found" errors
            console.error("Error loading current attendance:", error);
          }
          return;
        }

        // If user has checked in today but not checked out, disable remote check-in
        if (data && data.check_in && data.check_out === null) {
          setIsRemoteDisabled(true);
        } else {
          setIsRemoteDisabled(false);
          // loadCurrentAttendance();
        }
      } catch (err) {
        console.error("Unexpected error fetching attendance status:", err);
      }
    };

    fetchAttendanceStatus();
    loadCurrentAttendance();
  }, []);

  // Checking Today Leave For the User , If the User is Leave For Today , then Disable Its Checkin Button
  // useEffect(() => {

  const loadCurrentAttendance = async () => {
    if (!user) return;
    // || !isRemoteCheckedIn
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      );

      // Updated query to get the most recent unchecked-out attendance
      const { data, error } = await withRetry(() =>
        supabase
          .from("extrahours")
          .select("id, check_in, check_out")
          .eq("user_id", localStorage.getItem("user_id"))
          .gte("check_in", startOfDay.toISOString())
          .lte("check_in", endOfDay.toISOString())
          .is("check_out", null)
          .order("check_in", { ascending: false })
          .limit(1)
          .single()
      );

      if (error) {
        if (error.code !== "PGRST116") {
          // If no record exists, it's okay
          console.error("Error loading current attendance:", error);
        }
        return;
      }

      if (data) {
        if (data.check_out === null) {
          // User has an active session (not checked out)
          setIsRemoteCheckedIn(true);
          setRemoteAttendanceId(data.id);
          setRemoteCheckIn(data.check_in);
        } else {
          // User has checked out
          setIsRemoteCheckedIn(false);
        }
      } else {
        // No record found means user is not checked in
        setIsRemoteCheckedIn(false);
        console.log("No attendance record found");
      }
    } catch (err) {
      console.error("Error in loadCurrentAttendance:", err);
      setError(handleSupabaseError(err));
    }
  };

  //   loadCurrentAttendance();
  // }, [user]);

  // // Checking Today Leave For the User , If the User is Leave For Today , then Disable Its Checkin Button
  //   const checkAbsenteeStatus = async () => {
  //     // Get today's date in YYYY-MM-DD format
  //     const today = new Date().toISOString().split("T")[0];

  //     const { data, error } = await supabase
  //       .from("absentees")
  //       .select("absentee_type, absentee_date")
  //       .eq("user_id", localStorage.getItem('user_id'))
  //       .eq("absentee_type", "leave")
  //       .eq("absentee_date", today);

  //     if (error) {
  //       console.error("Error fetching absentee data:", error);
  //       return;
  //     }
  //     // console.log("Data from absentees" , data);

  //     // If there's at least one record, disable the button
  //     if (data.length > 0) {
  //       setIsRemoteDisabled(true);
  //     }
  //   };

  //   checkAbsenteeStatus();

  const loadRemoteAttendanceRecords = async () => {
    if (!user) return;

    try {
      let startDate, endDate;

      switch (Remoteview) {
        case "daily":
          startDate = format(selectedRemoteDate, "yyyy-MM-dd");
          endDate = format(
            addMinutes(new Date(startDate), 24 * 60 - 1),
            "yyyy-MM-dd"
          );
          break;
        case "weekly":
          startDate = format(startOfWeek(selectedRemoteDate), "yyyy-MM-dd");
          endDate = format(endOfWeek(selectedRemoteDate), "yyyy-MM-dd");
          break;
        case "monthly":
          startDate = format(startOfMonth(selectedRemoteDate), "yyyy-MM-dd");
          endDate = format(endOfMonth(selectedRemoteDate), "yyyy-MM-dd");
          break;
      }

      const { data: records, error: recordsError } = await withRetry(() =>
        supabase
          .from("extrahours")
          .select("*")
          .eq("user_id", localStorage.getItem("user_id"))
          .gte("check_in", `${startDate}T00:00:00Z`) // Corrected here
          .lt("check_in", `${endDate}T23:59:59Z`) // Corrected here
          .order("check_in", { ascending: false })
      );

      if (recordsError) throw recordsError;

      if (records && records.length > 0) {
        setRemoteAttendanceRecords(records);

        // Use the most recent attendance record to determine break status
        const latestRecord = records[0];

        // Load break records only for the latest attendance record
        const {
          data: breaks,
          error: breaksError,
        }: { data: BreakRecord[]; error: any } = await withRetry(() =>
          supabase
            .from("Remote_Breaks")
            .select("*")
            .eq("Remote_Id", latestRecord.id)
            .order("start_time", { ascending: true })
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
              setIsOnRemoteBreak(true);
              setRemoteBreakTime(previousBreak.start_time); // Record when the break started
            } else {
              // Otherwise, user is not on break.
              setIsOnRemoteBreak(false);
              setRemoteBreakTime(null);
            }
          } else {
            // If no breaks exist for this attendance record, user is not on break.
            setIsOnRemoteBreak(false);
            setRemoteBreakTime(null);
          }
        } else {
          // No break data for the latest attendance record
          setIsOnRemoteBreak(false);
          setRemoteBreakTime(null);
        }

        setRemoteBreakRecords(breakData);
      } else {
        // No attendance records found for the period
        setRemoteAttendanceRecords([]);
        setRemoteBreakRecords({});
        setIsOnRemoteBreak(false);
        setRemoteBreakTime(null);
      }
    } catch (err) {
      console.error("Error loading attendance records:", err);
      setError(handleSupabaseError(err));
    }
  };

  useEffect(() => {
    loadRemoteAttendanceRecords();
  }, [user, Remoteview, selectedRemoteDate]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  getCurrentLocation()
    .then((position) => {
      // console.log(position.coords.latitude);
      // console.log(position.coords.longitude);
    })
    .catch(() => {
      console.log("User Location Undefined");
    });

  const handleCheckIn = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      setCurrenRemotetLocation({ lat: latitude, lng: longitude });

      const now = new Date();
      const checkInTimeLimit = parse("09:30", "HH:mm", now);

      let attendanceStatus = "present";
      if (isAfter(now, checkInTimeLimit)) {
        attendanceStatus = "late";
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        OFFICE_LATITUDE,
        OFFICE_LONGITUDE
      );
      const mode = distance <= GEOFENCE_RADIUS ? "on_site" : "remote";

      const { data, error: dbError }: { data: AttendanceRecord; error: any } =
        await withRetry(() =>
          supabase
            .from("extrahours")
            .insert([
              {
                user_id: localStorage.getItem("user_id"),
                check_in: now.toISOString(),
                work_mode: mode,
                latitude,
                longitude,
                status: attendanceStatus,
              },
            ])
            .select()
            .single()
        );

      // Putting Half Day For Employee Checkin if the Checkin is After 11 am
      //  const RemotecheckInTime = now.getHours() * 60 + now.getMinutes(); // Convert time to minutes
      //  const cutoffTime = 11 * 60; // 11:00 AM in minutes
      //  if (RemotecheckInTime > cutoffTime) {
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

      setIsRemoteCheckedIn(true);
      setRemoteCheckIn(now.toISOString());
      setRemoteWorkMode(mode);
      setRemoteAttendanceId(data.id);
      await loadRemoteAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !RemoteattendanceId) {
      setError("No active attendance record found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();

      // First, end any ongoing breaks
      if (isOnRemoteBreak) {
        const { error: breakError }: { error: any } = await withRetry(() =>
          supabase
            .from("Remote_Breaks")
            .update({
              end_time: now.toISOString(),
              status: "on_time",
            })
            .eq("Remote_Id", RemoteattendanceId)
            .is("end_time", null)
        );

        if (breakError) throw breakError;

        setIsOnRemoteBreak(false);
        setRemoteBreakTime(null);
      }

      // Then update the attendance record with check-out time
      const { error: dbError }: { error: any } = await withRetry(() =>
        supabase
          .from("extrahours")
          .update({
            check_out: now.toISOString(),
          })
          .eq("id", RemoteattendanceId)
          .is("check_out", null)
      );

      if (dbError) throw dbError;

      // Reset all states
      setIsRemoteCheckedIn(false);
      setRemoteCheckIn(null);
      setRemoteWorkMode(null);
      setRemoteAttendanceId(null);

      // Reload attendance records to show the updated data
      await loadRemoteAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = async () => {
    if (!RemoteattendanceId) {
      setError("No active attendance record found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const breakEndLimit = parse("14:10", "HH:mm", now);

      if (!isOnRemoteBreak) {
        // Starting break
        const { error: dbError } = await withRetry(() =>
          supabase.from("Remote_Breaks").insert([
            {
              Remote_Id: RemoteattendanceId,
              start_time: now.toISOString(),
              status: "on_time",
            },
          ])
        );

        if (dbError) throw dbError;

        setIsOnRemoteBreak(true);
        setRemoteBreakTime(now.toISOString());
      } else {
        // Ending break
        let breakStatus = "on_time";
        if (isAfter(now, breakEndLimit)) {
          breakStatus = "late";
        }

        const { error: dbError } = await withRetry(() =>
          supabase
            .from("Remote_Breaks")
            .update({
              end_time: now.toISOString(),
              status: breakStatus,
            })
            .eq("Remote_Id", RemoteattendanceId)
            .is("end_time", null)
        );

        if (dbError) throw dbError;

        setIsOnRemoteBreak(false);
        setRemoteBreakTime(null);
      }
      await loadRemoteAttendanceRecords();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderRemoteAttendanceRecords = () => {
    return (
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {/* <Calendar className="w-6 h-6 text-blue-600" /> */}
              <img
                src={calendarImage}
                alt="timeImage"
                className="w-7 h-7"
              />{" "}
              &nbsp;
              <h2 className="text-xl font-semibold">
                Monthly Overview - &nbsp;
                {format(
                  selectedRemoteDate,
                  Remoteview === "daily" ? "MMMM d, yyyy" : "MMMM yyyy"
                )}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* <button
                onClick={() => setRemoteView('daily')}
                className={`px-3 py-1 rounded-lg ${Remoteview === 'daily' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Daily
              </button>
              <button
                onClick={() => setRemoteView('weekly')}
                className={`px-3 py-1 rounded-lg ${Remoteview === 'weekly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRemoteView('monthly')}
                className={`px-3 py-1 rounded-lg ${Remoteview === 'monthly' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Monthly
              </button> */}

              <select
                className="
              border border-gray-300
              px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                value={Remoteview}
                onChange={(e) => setRemoteView(e.target.value as ViewType)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setSelectedRemoteDate((prev) => {
                  switch (Remoteview) {
                    case "daily":
                      return addMinutes(prev, -24 * 60);
                    case "weekly":
                      return addMinutes(prev, -7 * 24 * 60);
                    case "monthly":
                      return addMinutes(prev, -30 * 24 * 60);
                  }
                })
              }
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-semibold text-xl leading-5 text-[#344054]">
              {format(
                selectedRemoteDate,
                Remoteview === "daily" ? "MMMM d, yyyy" : "MMMM yyyy"
              )}
            </span>
            <button
              onClick={() =>
                setSelectedRemoteDate((prev) => {
                  switch (Remoteview) {
                    case "daily":
                      return addMinutes(prev, 24 * 60);
                    case "weekly":
                      return addMinutes(prev, 7 * 24 * 60);
                    case "monthly":
                      return addMinutes(prev, 30 * 24 * 60);
                  }
                })
              }
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border-2 border-[#F5F5F9]">
              <thead>
                <tr>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">
                    Date
                  </th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">
                    Check In
                  </th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">
                    Check Out
                  </th>
                  {/* <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">Status</th> */}
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">
                    Work Mode
                  </th>
                  <th className="border p-6 border-gray-200 font-medium text-sm leading-5 text-[#344054] uppercase">
                    Breaks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {RemoteattendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.check_in), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.check_in), "hh:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.check_out
                        ? format(new Date(record.check_out), "hh:mm a")
                        : "-"}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.work_mode === "on_site"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                          }`}
                      >
                        {record.work_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {RemotebreakRecords[record.id]?.map(
                        (breakRecord, index) => (
                          <div key={breakRecord.id} className="mb-1">
                            <span className="text-gray-600">
                              Break {index + 1}:{" "}
                            </span>
                            {format(
                              new Date(breakRecord.start_time),
                              "hh:mm a"
                            )}
                            {breakRecord.end_time && (
                              <>
                                {" "}
                                -{" "}
                                {format(
                                  new Date(breakRecord.end_time),
                                  "hh:mm a"
                                )}
                              </>
                            )}
                            {/* {breakRecord.status && (
                            <span className={`ml-2 px-2 text-xs rounded-full ${
                              breakRecord.status === 'on_time'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {breakRecord.status}
                            </span>
                          )} */}
                          </div>
                        )
                      )}
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
      <h1 className="text-[28px] leading-9 text-[#000000] font-bold mb-6">
        Over Time
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 mb-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img src={timeImage} alt="timeImage" className="w-6 h-6" /> &nbsp;
              &nbsp;
              {/* <Clock className="w-6 h-6 text-blue-600 mr-2" /> */}
              <h2 className="text-[22px] leading-[30px] text-[#000000] font-semibold">
                Over-Time Status
              </h2>
            </div>
            {RemoteworkMode && (
              <span
                className={`px-3 py-1 rounded-full text-sm ${RemoteworkMode === "on_site"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
                  }`}
              >
                {RemoteworkMode === "on_site" ? "On-site" : "Remote"}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* {isRemoteDisabled && <span className="text-red-600 p-2 ">You are on Leave Today</span>} */}

          {isRemoteCheckedIn ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Checked in at:{" "}
                {RemotecheckInTime &&
                  format(new Date(RemotecheckInTime), "hh:mm a")}
              </p>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5 mr-2" />
                {loading ? "Checking out..." : "Check Out"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={loading || isRemoteDisabled} // Button is disabled if loading or if the condition is met
              className="w-full bg-[#9A00FF] text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Checking in..." : "Check In"}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <img src={teaImage} alt="teaImage" className="w-6 h-6" /> &nbsp;
            &nbsp;
            {/* <Coffee className="w-6 h-6 text-blue-600 mr-2" /> */}
            <h2 className="text-xl font-semibold">Break Time</h2>
          </div>

          {isRemoteCheckedIn && (
            <>
              {RemotebreakStartTime && (
                <p className="text-gray-600 mb-4">
                  Break started at:{" "}
                  {format(new Date(RemotebreakStartTime), "hh:mm a")}
                </p>
              )}

              <button
                onClick={handleBreak}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOnRemoteBreak
                  ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  } disabled:opacity-50`}
              >
                {loading
                  ? "Updating..."
                  : isOnRemoteBreak
                    ? "End Break"
                    : "Start Break"}
              </button>
            </>
          )}
        </div>
      </div>

      {renderRemoteAttendanceRecords()}
    </div>
  );
};

export default ExtraHours;
