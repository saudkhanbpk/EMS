import React, { useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import EmployeeMonthlyAttendanceTable from "./ListViewMonthly";
import EmployeeWeeklyAttendanceTable from "./ListViewWeekly";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Assuming you're using Lucide icons
import { format, addMonths, addWeeks } from "date-fns"; // Import the format function
import { DownloadIcon } from "lucide-react";
import { AttendanceContext } from "./AttendanceContext";

const EmployeeAttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // Filtered data for display
  const [error, setError] = useState(null);
  const [absent, setAbsent] = useState(0);
  const [present, setPresent] = useState(0);
  const [late, setLate] = useState(0);
  const [remote, setRemote] = useState(0); // State for remote employees count
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Daily");
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to current date
  const [loading, setLoading] = useState(true);
  const [selectedDateM, setselectedDateM] = useState(new Date());
  const [selectedDateW, setselectedDateW] = useState(new Date());
  const [currentFilter, setCurrentFilter] = useState("all"); // Filter state: "all", "present", "absent", "late", "remote"
  const [dataFromWeeklyChild, setDataFromWeeklyChild] = useState("");
  const { attendanceDataWeekly } = useContext(AttendanceContext);
  const { attendanceDataMonthly } = useContext(AttendanceContext);
  

 
  // function handleDataFromChild(attendanceDataWeekly) {
  //   console.log("Data received from child:", attendanceDataWeekly);
  //   setDataFromWeeklyChild(attendanceDataWeekly);
  // }
  const downloadPDF = async () => {    
    try {
      const response = await fetch('http://localhost:4000/generate-pdfDaily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: attendanceData }),
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
      const fileName = `attendance_${currentDate}.pdf`;
  
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
    
  // Handle Month change (previous/next)
  const handleMonthChange = (direction) => {
    setselectedDateM((prevDate) =>
      direction === "prev" ? addMonths(prevDate, -1) : addMonths(prevDate, 1)
    );
  };







  const downloadPDFWeekly = async () => {   
    // if (!dataFromWeeklyChild || dataFromWeeklyChild.length === 0) {
    //   console.error("No data available to generate PDF");
    //   return;
    // } 
    try {
      const response = await fetch('http://localhost:4000/generate-pdfWeekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: attendanceDataWeekly }),
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
      const fileName = `attendance_${currentDate}.pdf`;
  
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



  const downloadPDFMonthly = async () => {   
    // if (!dataFromWeeklyChild || dataFromWeeklyChild.length === 0) {
    //   console.error("No data available to generate PDF");
    //   return;
    // } 
    try {
      const response = await fetch('http://localhost:4000/generate-pdfMonthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: attendanceDataMonthly }),
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
      const fileName = `attendance_${currentDate}.pdf`;
  
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



  // Handle week change (previous/next)
  const handleWeekChange = (direction) => {
    setselectedDateW((prevDate) =>
      direction === "prev" ? addWeeks(prevDate, -1) : addWeeks(prevDate, 1)
    );
  };

  useEffect(() => {
    fetchAttendanceData(selectedDate);
  }, [selectedDate]);

  // Fetch attendance data
  const fetchAttendanceData = async (date) => {
    setLoading(true);
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name")
        .not('full_name', 'in', '("Admin")')
        .not('full_name', 'in', '("saud")'); 

      if (usersError) throw usersError;

      // Fetch attendance logs for the selected date
      const { data: attendanceLogs, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("user_id, check_in, check_out, work_mode, status")
        .gte("check_in", `${formattedDate}T00:00:00`)
        .lte("check_in", `${formattedDate}T23:59:59`);

      if (attendanceError) throw attendanceError;

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
      setFilteredData(finalAttendanceData); // Initialize filtered data with all data

      // Calculate counts
      const lateCount = finalAttendanceData.filter((entry) => entry.status.toLowerCase() === "late").length;
      setLate(lateCount);
      const presentCount = finalAttendanceData.filter((entry) => entry.status.toLowerCase() === "present").length;
      setPresent(presentCount);
      const absentCount = finalAttendanceData.filter((entry) => entry.status.toLowerCase() === "absent").length;
      setAbsent(absentCount);
      const remoteCount = finalAttendanceData.filter((entry) => entry.work_mode === "remote").length;
      setRemote(remoteCount);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle day change (previous/next)
  const handleDayChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "prev" ? -1 : 1));
    setSelectedDate(newDate);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    switch (filter) {
      case "all":
        setFilteredData(attendanceData);
        break;
      case "present":
        setFilteredData(attendanceData.filter((entry) => entry.status.toLowerCase() === "present"));
        break;
      case "absent":
        setFilteredData(attendanceData.filter((entry) => entry.status.toLowerCase() === "absent"));
        break;
      case "late":
        setFilteredData(attendanceData.filter((entry) => entry.status.toLowerCase() === "late"));
        break;
      case "remote":
        setFilteredData(attendanceData.filter((entry) => entry.work_mode === "remote"));
        break;
      default:
        setFilteredData(attendanceData);
    }
  };

  return (
    <div className="flex flex-col justify-center items-left min-h-full min-w-full bg-gray-100 px-6">
      {/* Heading */}
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Employee Attendance</h1>
      {/* Buttons and Date Navigation */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        {/* Buttons Row */}
        <div className="w-[40%] flex space-x-4">
          <button
            onClick={() => setSelectedTab("Daily")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === "Daily"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setSelectedTab("Weekly")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === "Weekly"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedTab("Monthly")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === "Monthly"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            Monthly
          </button>
        </div>
        <div className="flex flex-row gap-10">
        {/* Date Navigation */}
        {selectedTab === "Daily" && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDayChange("prev")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold">
              {format(selectedDate, "MMMM d, yyyy")}
            </span>
            <button
              onClick={() => handleDayChange("next")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {selectedTab === "Monthly" && (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleMonthChange("prev")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="mx-4 text-xl font-semibold">
              {format(selectedDateM, "MMMM yyyy")}
            </span>
            <button
              onClick={() => handleMonthChange("next")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {selectedTab === "Weekly" && (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleWeekChange("prev")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="mx-4 text-xl font-semibold">
              {format(selectedDateW, "MMMM yyyy")}
            </span>
            <button
              onClick={() => handleWeekChange("next")}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {selectedTab === "Daily" && (
          <button className="hover:bg-gray-300 px-6 py-2 rounded-2xl transition-all"
          onClick={downloadPDF}><DownloadIcon/> </button>
        )}
        {selectedTab === "Weekly" && (
          <button className="hover:bg-gray-300 px-6 py-2 rounded-2xl transition-all"
          onClick={ async () => {await downloadPDFWeekly()}}><DownloadIcon/> </button>
        )}
        {selectedTab === "Monthly" && (
          <button className="hover:bg-gray-300 px-6 py-2 rounded-2xl transition-all"
          onClick={downloadPDFMonthly}><DownloadIcon/> </button>
        )}
        </div>
      </div>

      {/* Loading Animation */}
      {loading && (
        <div className="w-full max-w-5xl space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="w-full h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Attendance Summary */}
      {!loading && selectedTab === "Daily" && (
        <>
          <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center text-lg font-medium">
              <button
                onClick={() => handleFilterChange("all")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-3xl hover:bg-gray-200 transition-all ${
                  currentFilter === "all" ? "bg-gray-200" : ""
                }`}
              >
                <span className="w-4 h-4 bg-gray-600 rounded-full"></span>
                <h2 className="text-gray-600">
                  Total: <span className="font-bold">{present + absent + late}</span>
                </h2>
              </button>
              <button
                onClick={() => handleFilterChange("present")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-3xl hover:bg-green-100 transition-all${
                  currentFilter === "present" ? "bg-green-200" : ""
                }`}
              >
                <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                <h2 className="text-green-600">
                  Present: <span className="font-bold">{present}</span>
                </h2>
              </button>
              <button
                onClick={() => handleFilterChange("absent")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-3xl hover:bg-red-100 transition-all${
                  currentFilter === "absent" ? "bg-red-100" : ""
                }`}
              >
                <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                <h2 className="text-red-600">
                  Absent: <span className="font-bold">{absent}</span>
                </h2>
              </button>
              <button
                onClick={() => handleFilterChange("late")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-3xl hover:bg-yellow-200 transition-all${
                  currentFilter === "late" ? "bg-yellow-100" : ""
                }`}
              >
                <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                <h2 className="text-yellow-600">
                  Late: <span className="font-bold">{late}</span>
                </h2>
              </button>
              <button
                onClick={() => handleFilterChange("remote")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-3xl hover:bg-purple-100 transition-all${
                  currentFilter === "remote" ? "bg-purple-100" : ""
                }`}
              >
                <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                <h2 className="text-purple-600">
                  Remote: <span className="font-bold">{remote}</span>
                </h2>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 text-gray-700 uppercase text-sm leading-normal">
                  <tr>
                    <th className="py-3 px-6 text-left">Employee Name</th>
                    <th className="py-3 px-6 text-left">Check-in</th>
                    <th className="py-3 px-6 text-left">Check-out</th>
                    <th className="py-3 px-6 text-left">Work Mode</th>
                    <th className="py-3 px-6 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="text-md font-normal">
                  {filteredData.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 ${
                            entry.status === "present"
                              ? "text-green-600"
                              : entry.status === "late"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.full_name.charAt(0).toUpperCase() + entry.full_name.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6">{entry.check_in}</td>
                      <td className="py-4 px-6">{entry.check_out}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            entry.work_mode === "on_site"
                              ? "bg-blue-100 text-blue-800"
                              : entry.work_mode === "remote"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-white text-black"
                          }`}
                        >
                          {entry.work_mode === "on_site" ? "On-site" : entry.work_mode === "remote" ? "Remote" : "-----"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            entry.status === "present"
                              ? "bg-green-100 text-green-800"
                              : entry.status === "late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Monthly View */}
      {!loading && selectedTab === "Monthly" && (
          <EmployeeMonthlyAttendanceTable 
            selectedDateM={selectedDateM} 
            // downloadPDFWeekly={downloadPDFWeekly} 
            // sendDataToParent={handleDataFromChild}           
              />
             
              )}
      {!loading && selectedTab === "Weekly" && <EmployeeWeeklyAttendanceTable selectedDateW={selectedDateW} />}
    </div>
  );
};

export default EmployeeAttendanceTable;