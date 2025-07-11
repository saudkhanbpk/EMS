import React, { useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  formatDate,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, DownloadIcon } from "lucide-react"; // Assuming you're using Lucide icons
import { AttendanceContext } from "./AttendanceContext";
import PersonAttendanceDetail from './PersonAttendanceDetail';
import { useAuthStore } from "../lib/store";

interface User {
  id: string;
  full_name: string;
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
  remoteDays: number;
  leavedays: number;
}

interface DailyAttendance {
  date: string;
  status: "present" | "absent";
  workingHours: number;
}

interface EmployeeWeeklyAttendanceTableProps {
  selectedDateW: Date;
}

const EmployeeWeeklyAttendanceTable: React.FC<EmployeeWeeklyAttendanceTableProps> = ({ selectedDateW }) => {
  const [attendanceDataWeekly, setattendanceDataWeekly] = useState<
    EmployeeStats[]
  >([]);
  const [filteredData, setFilteredData] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState("all");
  const user = useAuthStore((state) => state.user);
  const { setAttendanceDataWeekly } = useContext(AttendanceContext);
  const [status, setStatus] = useState("");
  const [workmode, setworkmode] = useState("");
  // Fetch data for the selected week
  const fetchAllEmployeesStats = async (date: Date) => {
    setLoading(true);
    try {
      // Fetch all users
      const { data: userprofile, error: userprofileerror } = await supabase.from("users").select("id, full_name,organization_id").eq("id", user?.id).single();
      if (userprofileerror) throw userprofileerror;

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .not("role", "in", "(client,admin,superadmin)")
        .eq("organization_id", userprofile.organization_id);
      if (usersError) throw usersError;

      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

      // Fetch all attendance records for the selected week
      const { data: weeklyAttendance, error: weeklyError } = await supabase
        .from("attendance_logs")
        .select("*")
        .gte("check_in", weekStart.toISOString())
        .lte("check_in", weekEnd.toISOString())
        .order("check_in", { ascending: true });

      if (weeklyError) throw weeklyError;

      // Fetch all breaks
      const { data: breaks, error: breaksError } = await supabase
        .from("breaks")
        .select("*")
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString());

      if (breaksError) throw breaksError;

      let year = weekStart.getFullYear();
      let month = String(weekStart.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      let day = String(weekStart.getDate()).padStart(2, "0");
      let weekEndformate = `[${year}-${month}-${day}]`;

      let year1 = weekEnd.getFullYear();
      let month1 = String(weekEnd.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      let day1 = String(weekEnd.getDate()).padStart(2, "0");
      let weekStartformate = `[${year1}-${month1}-${day1}]`;

      // Fetch all absentees
      const { data: absentees, error: absenteesError } = await supabase
        .from("absentees")
        .select("*")
        .gte("absentee_date", weekEndformate)
        .lte("absentee_date", weekStartformate);
      // .eq("absentee_Timing" , "Full Day");

      if (absenteesError) throw absenteesError;

      // Calculate expected working days
      const allDaysInWeek = eachDayOfInterval({
        start: weekStart,
        end: weekEnd,
      });
      const workingDaysInWeek = allDaysInWeek.filter(
        (date) => !isWeekend(date)
      ).length;

      const stats: EmployeeStats[] = await Promise.all(
        users.map(async (user) => {
          const { id, full_name } = user;

          // Filter attendance records for the current user
          const userAttendance = weeklyAttendance.filter(
            (record) => record.user_id === id
          );

          // Calculate unique attendance days
          const attendanceByDate = userAttendance.reduce((acc, curr) => {
            const date = format(new Date(curr.check_in), "yyyy-MM-dd");
            if (
              !acc[date] ||
              new Date(curr.check_in) < new Date(acc[date].check_in)
            ) {
              acc[date] = curr;
            }
            return acc;
          }, {} as Record<string, AttendanceRecord>);

          const uniqueAttendance: AttendanceRecord[] =
            Object.values(attendanceByDate);

          // Calculate total working hours and break hours separately
          let totalRawWorkHours = 0;
          let totalBreakHours = 0;
          let totalNetWorkHours = 0;

          // First, calculate total raw hours without breaks
          uniqueAttendance.forEach((attendance) => {
            const start = new Date(attendance.check_in);
            const end = attendance.check_out
              ? new Date(attendance.check_out)
              : new Date(start.getTime()); // If no check-out, use check-in time (0 hours)

            let hoursWorked =
              (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            // Handle negative values by using Math.max(0, hoursWorked)
            hoursWorked = Math.max(0, hoursWorked);
            // Cap at 12 hours per day
            totalRawWorkHours += Math.min(hoursWorked, 12);
          });

          // Group breaks by attendance_id for more efficient processing
          const breaksByAttendance = {};
          const userBreaks = breaks.filter((breakEntry) =>
            uniqueAttendance.some((a) => a.id === breakEntry.attendance_id)
          );
          userBreaks.forEach((b) => {
            if (!breaksByAttendance[b.attendance_id])
              breaksByAttendance[b.attendance_id] = [];
            breaksByAttendance[b.attendance_id].push(b);
          });

          // Now calculate break hours and net working hours for each attendance record
          uniqueAttendance.forEach((attendance) => {
            const start = new Date(attendance.check_in);
            const end = attendance.check_out
              ? new Date(attendance.check_out)
              : new Date(start.getTime());

            let hoursWorked =
              (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            // Handle negative values by using Math.max(0, hoursWorked)
            hoursWorked = Math.max(0, hoursWorked);

            // Calculate breaks for this attendance record
            const attendanceBreaks = breaksByAttendance[attendance.id] || [];
            let breakHoursForThisLog = 0;

            attendanceBreaks.forEach((b) => {
              if (b.start_time) {
                const breakStart = new Date(b.start_time);
                // If end_time is missing, calculate only 1 hour of break
                const breakEnd = b.end_time
                  ? new Date(b.end_time)
                  : new Date(breakStart.getTime() + 1 * 60 * 60 * 1000); // 1 hour default

                const thisBreakHours =
                  (breakEnd.getTime() - breakStart.getTime()) /
                  (1000 * 60 * 60);
                breakHoursForThisLog += thisBreakHours;
                totalBreakHours += thisBreakHours;
              }
            });

            // Calculate net hours for this attendance record
            const netHoursForThisLog = Math.max(
              0,
              Math.min(hoursWorked - breakHoursForThisLog, 12)
            );
            totalNetWorkHours += netHoursForThisLog;
          });

          // Use the net hours as the total work hours
          let totalHours = totalNetWorkHours;

          //Deleting Duplicates
          // const data = absentees

          //         // Helper function to extract the date from the `created_at` field
          // const extractDate = (created_at) => created_at.split('T')[0];

          // // Track occurrences of each user_id and date combination
          // const occurrenceMap = new Map();

          // // Check for duplicates
          // const duplicates = [];

          // data.forEach((record) => {
          //   const date = extractDate(record.created_at);
          //   const key = `${record.user_id}-${date}`;

          //   if (occurrenceMap.has(key)) {
          //     // If the key already exists, it's a duplicate
          //     duplicates.push({ ...record, duplicateOf: occurrenceMap.get(key) });
          //   } else {
          //     // Otherwise, store the key with the record's ID
          //     occurrenceMap.set(key, record.id);
          //   }
          // });

          // // Output duplicates
          // if (duplicates.length > 0) {
          //   console.log('Duplicate records found:', duplicates);
          // } else {
          //   console.log('No duplicate records found.');
          // }

          // const DuplicateIDS = duplicates.map((record) => record.id )
          // const {error: DeleteError} = await supabase
          // .from ("absentees")
          // .delete()
          // .in("id" , DuplicateIDS)

          // Calculate absent days
          const userAbsentees = absentees.filter(
            (absentee) => absentee.user_id === id
          );
          const leavesCount = userAbsentees.filter(
            (absentee) => absentee.absentee_type === "leave"
          ).length;
          const absenteesCount = userAbsentees.filter(
            (absentee) => absentee.absentee_type === "Absent"
          ).length;
          const remoteDays = uniqueAttendance.filter(
            (a) => a.work_mode === "remote"
          ).length;
          const presentDays = uniqueAttendance.filter(
            (a) => a.status === "present" || "late"
          ).length;
          const absentDays = absenteesCount;

          // Calculate working hours percentage
          const workingHoursPercentage =
            (totalHours / (workingDaysInWeek * 8)) * 100; // Assuming 8 hours per day

          return {
            user: { id, full_name },
            presentDays,
            absentDays,
            totalHoursWorked: totalHours,
            remoteDays,
            workingHoursPercentage,
            leavedays: leavesCount,
          };
        })
      );

      setattendanceDataWeekly(stats);
      setFilteredData(stats);
      setAttendanceDataWeekly(stats);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("Error fetching employee data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the selected date changes
  useEffect(() => {
    fetchAllEmployeesStats(selectedDateW);
  }, [selectedDateW]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    switch (filter) {
      case "all":
        setFilteredData(attendanceDataWeekly);
        break;
      case "poor":
        setFilteredData(
          attendanceDataWeekly.filter(
            (entry) => entry.workingHoursPercentage < 70
          )
        );
        break;
      case "good":
        setFilteredData(
          attendanceDataWeekly.filter(
            (entry) =>
              entry.workingHoursPercentage >= 70 &&
              entry.workingHoursPercentage < 80
          )
        );
        break;
      case "excellent":
        setFilteredData(
          attendanceDataWeekly.filter(
            (entry) => entry.workingHoursPercentage >= 80
          )
        );
        break;
      default:
        setFilteredData(attendanceDataWeekly);
    }
  };

  // Handle row click to show detailed view
  const handleRowClick = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
  };

  // Handle closing the detail view
  const handleCloseDetail = () => {
    setSelectedUser(null);
  };

  const handleDownload = async (userId: string, fullName: string) => {
    try {
      const weekStart = startOfWeek(selectedDateW, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDateW, { weekStartsOn: 1 });

      // Fetch attendance records
      const { data: weeklyAttendance, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("check_in", weekStart.toISOString())
        .lte("check_in", weekEnd.toISOString())
        .order("check_in", { ascending: true });

      if (attendanceError) throw attendanceError;

      // Fetch absentees with absentee_timing and absentee_type
      const { data: absentees, error: absenteesError } = await supabase
        .from("absentees")
        .select("created_at, absentee_Timing, absentee_type")
        .eq("user_id", userId)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      if (absenteesError) throw absenteesError;

      // Get all days in the week
      const allDaysInWeek = eachDayOfInterval({
        start: weekStart,
        end: weekEnd,
      });

      const dailyAttendance = allDaysInWeek.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");

        // Find attendance record
        const attendance = weeklyAttendance.find(
          (a) => format(new Date(a.check_in), "yyyy-MM-dd") === dateStr
        );

        // Find absentee record
        const absentee = absentees.find(
          (a) => format(new Date(a.created_at), "yyyy-MM-dd") === dateStr
        );

        let status = "Null"; // Default to present
        let workmode = "Null"; // Default to On Site
        let workingHours = 0;
        let checkIn = null;
        let checkOut = null;

        if (attendance) {
          status = "Present";
          const formatDate = (date: Date) => {
            return new Intl.DateTimeFormat("en-US", {
              // day: '2-digit',
              // month: 'short',
              // year: 'numeric',
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(date);
          };

          // Example usage in your code
          workmode = attendance.work_mode;
          checkIn = formatDate(new Date(attendance.check_in));
          checkOut = formatDate(
            new Date(
              attendance.check_out ||
              new Date(new Date(checkIn).getTime() + 4 * 60 * 60 * 1000)
            )
          );
          // workingHours = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60);
          // workingHours = Math.min(workingHours, 12); // Cap at 12 hours

          console.log("Attendance", attendance);
        }

        if (absentee) {
          if (absentee && !attendance) {
            workmode === "null";
          }
          if (
            absentee.absentee_Timing === "Full Day" &&
            absentee.absentee_type === "Absent"
          ) {
            status = "Absent";
          } else if (
            absentee.absentee_Timing === "Half Day" &&
            absentee.absentee_type === "Absent"
          ) {
            status = "Half Day Absent";
          } else if (
            absentee.absentee_Timing === "Half Day" &&
            absentee.absentee_type === "leave"
          ) {
            status = "Half Day Leave";
          } else if (absentee.absentee_type === "Sick Leave") {
            status = "Sick Leave";
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

      console.log(`Weekly Attendance for ${fullName}:`, dailyAttendance);

      // Filter out undefined values
      const filteredDailyAttendance = dailyAttendance.filter((entry) => entry);

      downloadPDF(filteredDailyAttendance, fullName);
    } catch (error) {
      console.error("Error fetching weekly data:", error);
      alert("Error fetching weekly data");
    }
  };

  const downloadPDF = async (filteredDailyAttendance, fullName) => {
    try {
      const response = await fetch(
        "https://ems-server-0bvq.onrender.com/generate-pdfWeeklyOfEmployee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: filteredDailyAttendance }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();

      if (blob.type !== "application/pdf") {
        throw new Error("Received incorrect file format");
      }

      const url = window.URL.createObjectURL(blob);
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `Weekly attendance_${currentDate} of ${fullName}.pdf`;

      // Create and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Open PDF manually
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const totalEmployees = attendanceDataWeekly.length;
  const badCount = attendanceDataWeekly.filter(
    (entry) => entry.workingHoursPercentage < 50
  ).length;
  const betterCount = attendanceDataWeekly.filter(
    (entry) =>
      entry.workingHoursPercentage >= 50 && entry.workingHoursPercentage < 80
  ).length;
  const bestCount = attendanceDataWeekly.filter(
    (entry) => entry.workingHoursPercentage >= 80
  ).length;

  return (
    <div className="flex flex-col justify-center items-center min-h-full min-w-full bg-gray-100 p-0">
      {/* Loading Animation */}
      {loading && (
        <div className="w-full max-w-5xl space-y-6">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="w-full h-16 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Filter Div */}
      {!loading && (
        <div className="w-full max-w-7xl bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex sm:flex-nowrap flex-wrap justify-between items-center text-lg font-medium">
            <button
              onClick={() => handleFilterChange("all")}
              className={`flex items-center space-x-2 ${currentFilter === "all" ? "font-bold" : ""
                }`}
            >
              <span className="sm:block hidden h-4 bg-gray-600 rounded-full"></span>
              <h2 className="text-gray-600 sm:text-xl text-sm">
                Total: <span className="font-bold">{totalEmployees}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange("poor")}
              className={`flex items-center space-x-2 ${currentFilter === "poor" ? "font-bold" : ""
                }`}
            >
              <span className="sm:block hidden w-4 h-4 bg-red-500 rounded-full"></span>
              <h2 className="text-red-600 sm:text-xl text-sm">
                Bad : <span className="font-bold">{badCount}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange("good")}
              className={`flex items-center space-x-2 ${currentFilter === "good" ? "font-bold" : ""
                }`}
            >
              <span className="sm:block hidden w-4 h-4 bg-yellow-500 rounded-full"></span>
              <h2 className="text-yellow-600 sm:text-xl text-sm">
                Fair: <span className="font-bold">{betterCount}</span>
              </h2>
            </button>
            <button
              onClick={() => handleFilterChange("excellent")}
              className={`flex items-center space-x-2 ${currentFilter === "excellent" ? "font-bold" : ""
                }`}
            >
              <span className="sm:block hidden  w-4 h-4 bg-green-500 rounded-full"></span>
              <h2 className="text-green-600 sm:text-xl text-sm">
                Good: <span className="font-bold">{bestCount}</span>
              </h2>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {!loading && (
        <div className="w-full max-w-7xl bg-white p-6 rounded-lg shadow-lg">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="max-w-7xl">
            {/* Desktop view - only visible on md screens and above */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full  bg-white">
                <thead className="bg-gray-50 text-gray-700 uppercase text-sm leading-normal">
                  <tr>
                    <th className="py-3 px-6 text-left">Employee Name</th>
                    <th className="py-3 px-6 text-left">Present Days</th>
                    <th className="py-3 px-6 text-left">Absent Days</th>
                    <th className="py-3 px-6 text-left">Leave Days</th>
                    <th className="py-3 px-6 text-left">Remote Days</th>
                    <th className="py-3 px-6 text-left">Total Hours Worked</th>
                    <th className="py-3 px-6 text-left">Working Hours %</th>
                    {/* <th className="py-3 px-6 text-left">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="text-md font-normal">
                  {filteredData.map((entry, index) => {
                    const percentageColor =
                      entry.workingHoursPercentage < 70
                        ? "bg-red-500 text-white"
                        : entry.workingHoursPercentage >= 70 &&
                          entry.workingHoursPercentage < 80
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white";

                    const nameColor =
                      entry.workingHoursPercentage < 70
                        ? "text-red-500"
                        : "text-gray-800";

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                        onClick={() => handleRowClick(entry.user.id, entry.user.full_name)}
                      >
                        <td className={`py-4 px-6 ${nameColor}`}>
                          {entry.user.full_name}
                        </td>
                        <td className="py-4 px-6">{entry.presentDays}</td>
                        <td className="py-4 px-6">{entry.absentDays}</td>
                        <td className="py-4 px-6">{entry.leavedays}</td>
                        <td className="py-4 px-6">{entry.remoteDays}</td>
                        <td className="py-4 px-6">
                          {entry.totalHoursWorked.toFixed(2)} hrs
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${percentageColor}`}
                          >
                            {entry.workingHoursPercentage.toFixed(2)}%
                          </span>
                        </td>
                        {/* <td className="py-3 pl-10">
                <button
                  onClick={() => handleDownload(entry.user.id, entry.user.full_name)}
                  className="p-1 hover:bg-gray-300 transition-all rounded-2xl text-gray-500"
                >
                  <DownloadIcon />
                </button>
              </td> */}
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500"
                      >
                        No attendance records found for this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile view - only visible on smaller than md screens */}
            <div className="md:hidden">
              {filteredData.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-white rounded-lg shadow-sm">
                  No attendance records found for this week.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredData.map((entry, index) => {
                    const percentageColor =
                      entry.workingHoursPercentage < 70
                        ? "bg-red-500 text-white"
                        : entry.workingHoursPercentage >= 70 &&
                          entry.workingHoursPercentage < 80
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white";

                    const nameColor =
                      entry.workingHoursPercentage < 70
                        ? "text-red-500"
                        : "text-gray-800";

                    return (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleRowClick(entry.user.id, entry.user.full_name)}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className={`font-medium text-lg ${nameColor}`}>
                            {entry.user.full_name}
                          </h3>
                          <button
                            onClick={() =>
                              handleDownload(
                                entry.user.id,
                                entry.user.full_name
                              )
                            }
                            className="p-1 hover:bg-gray-300 transition-all rounded-2xl text-gray-500"
                          >
                            <DownloadIcon />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="py-1">
                            <span className="text-gray-500">Present Days:</span>
                            <p className="font-medium">{entry.presentDays}</p>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500">Absent Days:</span>
                            <p className="font-medium">{entry.absentDays}</p>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500">Remote Days:</span>
                            <p className="font-medium">{entry.remoteDays}</p>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500">Total Hours:</span>
                            <p className="font-medium">
                              {entry.totalHoursWorked.toFixed(2)} hrs
                            </p>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500">
                              Working Hours:
                            </span>
                            <p className="mt-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${percentageColor}`}
                              >
                                {entry.workingHoursPercentage.toFixed(2)}%
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Person Attendance Detail Modal */}
      {selectedUser && (
        <PersonAttendanceDetail
          userId={selectedUser.id}
          userName={selectedUser.name}
          selectedMonth={selectedDateW}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default EmployeeWeeklyAttendanceTable;
