import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const FilterDataUser = ({ startdate, enddate, search, selectedtab }) => {
  const [attendance, setAttendance] = useState([]);
  const [absentees, setabsentees] = useState([]);
  const [breaks, setbreaks] = useState([]);
  const [Error, setError] = useState("");
  const [filtereddata, setFilteredData] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const userID = localStorage.getItem("user_id");

  const func1 = async () => {
    setisLoading(true);
    setFilteredData([]); // Reset filtered data before fetching new data

    const startDateFormatted = `${startdate}T00:00:00.000Z`;
    const endDateFormatted = `${enddate}T23:59:59.000Z`;

    // Fetch attendance data
    const { data: attendanceData, error: attendanceerror } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", userID)
      .gte("check_in", startDateFormatted)
      .lte("check_in", endDateFormatted);

    if (attendanceerror) return setError(attendanceerror);

    setAttendance(attendanceData);
    console.log("AttendAnceData", attendanceData);

    // Fetch absentee data
    const { data: absenteesData, error: absenteesError } = await supabase
      .from("absentees")
      .select("*")
      .eq("user_id", userID)
      .gte("created_at", startDateFormatted)
      .lte("created_at", endDateFormatted);

    if (absenteesError) return setError(absenteesError);

    setabsentees(absenteesData);
    console.log("Absentees Data", absenteesData);

    // Fetch breaks data
    const { data: breaksData, error: breaksError } = await supabase
      .from("breaks")
      .select("*")
      .eq("user_id", userID)
      .gte("created_at", startDateFormatted)
      .lte("created_at", endDateFormatted);

    if (breaksError) return setError(breaksError);

    setbreaks(breaksData);
    console.log("Breaks", breaksData);

    setisLoading(false);
  };

  const func2 = () => {
    if (!attendance.length && !absentees.length) return;

    const dataByDate = new Map();

    // Process Attendance Data
    attendance.forEach((entry) => {
      const date = entry.check_in.split("T")[0];
      const checkInTime = new Date(entry.check_in).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const checkOutTime = entry.check_out
        ? new Date(entry.check_out).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A";

      dataByDate.set(date, {
        date,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: entry.status,
        work_mode: entry.work_mode || "N/A",
      });
    });

    // Process Absentees Data
    absentees.forEach((entry) => {
      const date = entry.created_at.split("T")[0];

      if (!dataByDate.has(date)) {
        dataByDate.set(date, {
          date,
          checkIn: "Absent",
          checkOut: "Absent",
          status: "Absent",
          work_mode: "N/A",
        });
      }
    });

    // Merge all data
    const mergedData = Array.from(dataByDate.values());
    mergedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredData(mergedData);
    setisLoading(false); // Set loading false after data is merged
  };

  useEffect(() => {
    const runit = async () => {
      await func1();
      func2();
    };
    runit();
  }, [search]);

  return (
    <>
      <div className="width-full bg-red rounded-3xl shadow-lg max-w-5xl">
        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 p-4 text-gray-900 font-semibold text-md leading-normal">
              <td className="px-3 py-6 text-center">Date</td>
              <td className="px-3 py-6 text-center">Check-In</td>
              <td className="px-3 py-6 text-center">Check-Out</td>
              <td className="px-3 py-6 text-center">Status</td>
              <td className="px-3 py-6 text-center">Work Mode</td>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-4">
                    <div className="w-full max-w-5l space-y-4 px-10">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="w-full h-16 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtereddata.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-4">
                    No Data Available for the Selected Date Range
                  </td>
                </tr>
              )}
              {!isLoading && filtereddata.length > 0 && (
                filtereddata.map((data, index) => (
                  <tr key={index} className="text-gray-700">
                    <td className="px-3 py-4 text-center">{data.date}</td>
                    <td className="px-3 py-4 text-center">{data.checkIn}</td>
                    <td className="px-3 py-4 text-center">{data.checkOut}</td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          data.status === "present"
                            ? "bg-green-100 text-green-800"
                            : data.status === "late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {data.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          data.work_mode === "on_site"
                            ? "bg-blue-100 text-blue-800"
                            : data.work_mode === "remote"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-white text-black"
                        }`}
                      >
                        {data.work_mode === "on_site"
                          ? "On-site"
                          : data.work_mode === "remote"
                          ? "Remote"
                          : "-----"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default FilterDataUser;
