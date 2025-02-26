import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const EmployeeAttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Fetch all users first
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name");

    if (usersError) {
      setError(usersError.message);
      console.error("Error fetching users:", usersError);
      return;
    }

    // Fetch today's attendance logs
    const { data: attendanceLogs, error: attendanceError } = await supabase
      .from("attendance_logs")
      .select("user_id, check_in, check_out, work_mode, status")
      .gte("check_in", `${today}T00:00:00`)
      .lte("check_in", `${today}T23:59:59`);

    if (attendanceError) {
      setError(attendanceError.message);
      console.error("Error fetching attendance logs:", attendanceError);
      return;
    }

    // Map attendance data by user_id
    const attendanceMap = new Map(attendanceLogs.map((log) => [log.user_id, log]));

    // Build final list with text colors
    const finalAttendanceData = users.map((user) => {
      const log = attendanceMap.get(user.id);
      const formatTime = (dateString) => {
        if (!dateString || dateString === "N/A") return "N/A";
      
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true, // Ensures AM/PM format
        });
      };
      

      if (!log) {
        return {
          full_name: user.full_name,
          check_in: "N/A",
          check_out: "N/A",
          work_mode: "N/A",
          status: "Absent",
          textColor: "text-red-500",
        };
      }

      return {
        full_name: user.full_name,
        check_in: log.check_in ? formatTime(log.check_in) : "N/A",
        check_out: log.check_out ? formatTime(log.check_out) : "N/A",
        work_mode: log.work_mode || "N/A",
        status: log.status || "Absent",
        textColor:
          log.status.toLowerCase() === "present"
            ? "text-green-500"
            : log.status.toLowerCase() === "late"
            ? "text-yellow-500"
            : "text-red-500",
      };
    });

    setAttendanceData(finalAttendanceData);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">
          Today's Attendance Data
        </h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto border border-gray-300 rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead className="sticky top-0 bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Employee Name</th>
                  <th className="py-3 px-6 text-left">Check-in</th>
                  <th className="py-3 px-6 text-left">Check-out</th>
                  <th className="py-3 px-6 text-left">Work Mode</th>
                  <th className="py-3 px-6 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="text-md font-normal">
                {attendanceData.map((entry, index) => (
                  <tr key={index} className={`border-b border-gray-200 ${entry.textColor}`}>
                    <td className="py-3 px-6 ">{entry.full_name}</td>
                    <td className="py-3 px-6">{entry.check_in}</td>
                    <td className="py-3 px-6">{entry.check_out}</td>
                    <td className="py-3 px-6">{entry.work_mode}</td>
                    <td className="py-3 px-6 ">{entry.status}</td>
                  </tr>
                ))}
                {attendanceData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No attendance records found for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceTable;
