import React, { useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import EmployeeMonthlyAttendanceTable from "./ListViewMonthly";
import EmployeeWeeklyAttendanceTable from "./ListViewWeekly";
import { ChevronLeft, ChevronRight , SearchIcon } from "lucide-react"; // Assuming you're using Lucide icons
import { format, parse, isAfter, addMonths, addWeeks } from "date-fns"; // Import the format function
import { DownloadIcon } from "lucide-react";
import { AttendanceContext } from "./AttendanceContext";
import ReactTooltip from 'react-tooltip';
import TimePicker from 'react-time-picker';
import "./style.css"
import { AttendanceProvider } from "./AttendanceContext";
import FilteredDataAdmin from "./filteredListAdmin";

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
  const [selectedEntry, setSelectedEntry] = useState(null);
  // const [newCheckOutTime, setNewCheckOutTime] = useState('00 : 00');
  const [hour, setHour] = useState(12);  // Default hour
  const [minute, setMinute] = useState(0);  // Default minute
  const [isAM, setIsAM] = useState(true);  // AM/PM toggle
  const [updatedCheckOutTime, setupdatedCheckOutTime] = useState('')
  const [isCheckinModalOpen, setisCheckinModalOpen] = useState(false);
  // const [newCheckInTime, setNewCheckInTime] = useState('00 : 00');
  const [hourin, setHourin] = useState(12);  // Default hour
  const [minutein, setMinutein] = useState(0);  // Default minute
  const [isinAM, setIsinAM] = useState(true);  // AM/PM toggle
  const [updatedCheckInTime, setupdatedCheckInTime] = useState('');
  const [isModalOpen , setIsModalOpen] = useState(false);
  // const [formattedDate2, setformattedDate2] = useState('');
  const [startdate, setStartdate] = useState(''); 
  const [enddate, setEnddate] = useState('');
  const [search , setsearch] = useState(false);

  const { attendanceDataWeekly, attendanceDataMonthly } = useContext(AttendanceContext);
  const {AttendanceDataFiltered , setattendanceDataFiltered} = useContext(AttendanceContext);

  const handleHourChange = (e) => {
    setHour(e.target.value);
  };

  const handleMinuteChange = (e) => {
    setMinute(e.target.value);
  };

  const toggleAMPM = () => {
    setIsAM(!isAM);
  };

  const handleCheckInHourChange = (e) => {
    setHourin(e.target.value);
  };

  const handleCheckInMinuteChange = (e) => {
    setMinutein(e.target.value);
  };
  const togglecheckinAMPM = () => {
    setIsinAM(!isinAM);
  };
  

  //Extracting Hours and Minuates From the previously saved Checkout Time
  const parseCheckOutTime = (checkOutTime) => {
    const regex = /(\d{2}):(\d{2})\s(AM|PM)/;
    const match = checkOutTime.match(regex);
    if (match) {
      const extractedHour = parseInt(match[1], 10);
      const extractedMinute = parseInt(match[2], 10);
      const extractedAMPM = match[3];

      setHour(extractedHour);
      setMinute(extractedMinute);
      setIsAM(extractedAMPM === 'AM');
    }
  };
  //Extracting Hours and Minuates From the previously saved Checkout Time
  const parseCheckInTime = (checkInTime) => {
    const regex = /(\d{2}):(\d{2})\s(AM|PM)/;
    const match = checkInTime.match(regex);
    if (match) {
      const extractedHourin = parseInt(match[1], 10);
      const extractedMinutein = parseInt(match[2], 10);
      const extractedAMPMin = match[3];

      setHourin(extractedHourin);
      setMinutein(extractedMinutein);
      setIsinAM(extractedAMPMin === 'AM');
    }
  };
   // Open modal and set the selected entry and default time
   const handleCheckinOpenModal = (entry) => {
    setSelectedEntry(entry);
    parseCheckInTime(entry.check_in)
    // setNewCheckInTime(entry.check_in || ''); // Set default time
    setisCheckinModalOpen(true);
    
  };

  // Open modal and set the selected entry and default time
  const handleOpenModal = (entry) => {
    console.log("entry" , entry);  
    setSelectedEntry(entry);
    parseCheckOutTime(entry.check_out)
    // setNewCheckOutTime(entry.check_out || ''); // Set default time
    setIsModalOpen(true);
    
  };

  
const handleUpdateCheckInTime = async () => {
  console.log("selectedEntry.check_out2:", selectedEntry.check_out2);

  // Format hour and minute to ensure two digits
  const formattedHourin = hourin < 10 ? `0${hourin}` : hourin;
  const formattedMinutein = minutein < 10 ? `0${minutein}` : minutein;

  // Extract the date from selectedEntry.check_out2
  let originalDate;
  if (selectedEntry.check_out2 === null || !selectedEntry.check_out2 || selectedEntry.check_out2 === "N/A") {
      originalDate = new Date();
  } else {
      originalDate = new Date(selectedEntry.check_out2);
  }

       

  // Ensure originalDate is valid
  if (isNaN(originalDate.getTime())) {
      console.error("Error: selectedEntry.check_out2 is not a valid date.");
      alert("Error: Invalid check-out date format.");
      return;
  }

  const year = originalDate.getFullYear();
  const month = originalDate.getMonth(); // Month is zero-indexed
  const day = originalDate.getDate();

  const year2 = new Date().getFullYear();
  const month2 = new Date().getMonth();
  const day2 = new Date().getDate();

  // Adjust for AM/PM (convert to 24-hour format if PM)
  let adjustedHourin = isinAM ? parseInt(formattedHourin, 10) : (parseInt(formattedHourin, 10) + 12) % 24;

  // Create a new Date object with the updated time but keeping the original date
  let formattedDate2;
  if (selectedEntry.check_out2 === null || selectedDate.check_out2 === "N/A") {
      formattedDate2 = new Date(year2, month2, day2, adjustedHourin, parseInt(formattedMinutein, 10), 0, 0);
  } else {
      formattedDate2 = new Date(year, month, day, adjustedHourin, parseInt(formattedMinutein, 10), 0, 0);
  }

  // Convert the Date object to the required format [YYYY-MM-DD HH:MM:SS.000+00]
  const timestamp = formattedDate2.toISOString().replace('T', ' ').split('.')[0] + '.000+00';

  const now = new Date(timestamp);
  const checkInTimeLimit = parse('09:30', 'HH:mm', now);

  let attendanceStatus = 'present';
  if (isAfter(now, checkInTimeLimit)) {
    attendanceStatus = 'late';
  }

  // Assign the formatted time string to update state
  setupdatedCheckInTime(timestamp);
  console.log("checkinTimelimit", checkInTimeLimit);
  console.log("attendanceStatus", attendanceStatus);
  

  // Update the `check_in` field in the database
  const { data, error } = await supabase
      .from("attendance_logs")
      .update({ check_in: timestamp ,
         status: attendanceStatus }
      ) // Updating check_in with the new timestamp
      .eq("user_id", selectedEntry.id) // Ensure correct entry by user_id
      .eq("check_out", selectedEntry.check_out2); // Match check_in for that specific date

  if (data) {
      console.log("Updated data:", data); // Log success
  }

  if (!error) {
      alert("Check-in time updated successfully.");
  } else {
      console.error("Error updating check-in time:", error);
  }

  // Close modal after update
  setisCheckinModalOpen(false);
};

  const handleCheckInCloseModal = () => {
    setisCheckinModalOpen(false);
  }
  


  
  const handleUpdateCheckOutTime = async () => {
    console.log("selectedEntry.check_in2:", selectedEntry.check_in2);

    // Format hour and minute to ensure two digits
    const formattedHour = hour < 10 ? `0${hour}` : hour;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;

    // Extract the date from selectedEntry.check_in2
    let originalDate;
    if (selectedEntry.check_in2 === null || !selectedEntry.check_in2 || selectedEntry.check_in2 === "N/A") {
        originalDate = new Date();
    } else {
        originalDate = new Date(selectedEntry.check_in2);
    }

    // Ensure originalDate is valid
    if (isNaN(originalDate.getTime())) {
        console.error("Error: selectedEntry.check_in2 is not a valid date.");
        alert("Error: Invalid check-in date format.");
        return;
    }

    const year = originalDate.getFullYear();
    const month = originalDate.getMonth(); // Month is zero-indexed
    const day = originalDate.getDate();

    const year2 = new Date().getFullYear();
    const month2 = new Date().getMonth();
    const day2 = new Date().getDate();

    // Adjust for AM/PM (convert to 24-hour format if PM)
    let adjustedHour = isAM ? parseInt(formattedHour, 10) : (parseInt(formattedHour, 10) + 12) % 24;

    // Create a new Date object with the updated time but keeping the original date
    let formattedDate;
    if (selectedEntry.check_in2 === null) {
        formattedDate = new Date(year2, month2, day2, adjustedHour, parseInt(formattedMinute, 10), 0, 0);
    } else {
        formattedDate = new Date(year, month, day, adjustedHour, parseInt(formattedMinute, 10), 0, 0);
    }

    // Convert the Date object to the required format [YYYY-MM-DD HH:MM:SS.000+00]
    const timestamp = formattedDate.toISOString().replace('T', ' ').split('.')[0] + '.000+00';

    console.log("Selected time:", timestamp);

    // Assign the formatted time string to update state
    setupdatedCheckOutTime(timestamp);

    // Update the `check_out` field in the database
    const { data, error } = await supabase
        .from("attendance_logs")
        .update({ check_out: timestamp })  // Updating check_out with the new timestamp
        .eq("user_id", selectedEntry.id)  // Ensure correct entry by user_id
        .eq("check_in", selectedEntry.check_in2); // Match check_in for that specific date

    if (data) {
        console.log("Updated data:", data); // Log success
    }

    if (!error) {
        alert("Check-out time updated successfully.");
    } else {
        console.error("Error updating check-out time:", error);
    }

    // Close modal after update
    setIsModalOpen(false);
};

  


const handleCloseModal = () => {
  setIsModalOpen(false);
}

 
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

















  const downloadPDFFiltered = async () => {   
    // if (!dataFromWeeklyChild || dataFromWeeklyChild.length === 0) {
    //   console.error("No data available to generate PDF");
    //   return;
    // } 
    try {
      const response = await fetch('http://localhost:4000/generate-Filtered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: AttendanceDataFiltered }),
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
      if (usersError) throw usersError;

      // Fetch attendance logs for the selected date
      const { data: attendanceLogs, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("user_id, check_in, check_out, work_mode, status, created_at , autocheckout")
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
            id : user.id,
            full_name: user.full_name,
            check_in: "N/A",
            check_in2: "N/A",
            created_at: "N/A",
            check_out2: "N/A",
            check_out: "N/A",
            autocheckout : "",
            work_mode: "N/A",
            status: "Absent",
            textColor: "text-red-500",
          };
        }

        return {
          id : user.id,
          full_name: user.full_name,
          check_in2: log.check_in ? log.check_in : "N/A",
          check_out2: log.check_out ? log.check_out : "N/A",
          created_at: log.created_at ? log.created_at : "N/A",
          // created_at: log.created_at ?  new Date(log.created_at).toISOString().split('.')[0] + "+00:00" : "N/A",
          check_in: log.check_in ? formatTime(log.check_in) : "N/A",
          check_out: log.check_out ? formatTime(log.check_out) : "N/A",
          autocheckout : log.autocheckout || "",
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

  const now = new Date();

  // Pakistan is in UTC+5, so add 5 hours to the UTC time
  const offset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  const pakistanTime = new Date(now.getTime() + offset);
  // Handle day change (previous/next)
  const handleDayChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "prev" ? -1 : 1));
    setSelectedDate(newDate);
    console.log("passing time : " , newDate);
    console.log("pakistan time time : " , pakistanTime);
    
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
      const handlenotification = () => {
        Notification.requestPermission()
        .then(()=> {
          const notification = new Notification("Office Time Update",{
             body: "Please note that our office time is from 9:00 AM to 4:00 PM.",
             icon : "./efficiency.png"
          })
        })
      }

     const  handleDateFilter = () => {
      setSelectedTab("Filter")
      setsearch((prev) => !prev)
     }


  return (
    <div className="flex flex-col justify-center items-center min-h-full min-w-full bg-gray-100 px-6">
      {/* Heading */}
      <div className=" w-full max-w-5xl items-center flex">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Employee Attendance</h1>
      </div>
      {/* Buttons and Date Navigation */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        {/* Buttons Row */}
        <div className="w-[40%] flex space-x-4">
        {/* <button
            onClick={() => handlenotification()}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === "Daily"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            notify
          </button> */}
          <button
            onClick={() =>  setSelectedTab("Daily")}
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
          <button
            onClick={() => setSelectedTab("Filter")}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTab === "Filter"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            Filter
          </button>
        </div>
        <div className="flex flex-row gap-5">
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
              onClick={() => {
                handleWeekChange("next")
                // console.log("selectedDateW", selectedDateW);
              }}
              className="p-2 hover:bg-gray-200 rounded-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {selectedTab === "Filter" && (
  <div className="flex items-center justify-center space-x-4">
    {/* Date Range Inputs */}
    <input
      type="date"
      value={startdate} // State variable for the start date
      onChange={(e) => setStartdate(e.target.value)} // Update start date
      className="p-2 border ml-10 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <span className="mx-2 text-xl font-semibold">to</span>
    <input
      type="date"
      value={enddate} // State variable for the end date
      onChange={(e) => setEnddate(e.target.value)} // Update end date
      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    {/* Search Button */}
    <button
      onClick={() => {
        // const enddate2 = endDate.toString() + "T23:59:59";
        // console.log("Start Date:", startDate.toString() + "T00:00:00");
        // console.log("End Date:", enddate2);
        handleDateFilter()
      }}
      className="p-2 hover:bg-gray-300 rounded-2xl px-5 py-3 transition-all"
    >
      <SearchIcon className="w-5 h-5" />
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
        {selectedTab === "Filter" && (
          <button className="hover:bg-gray-300 px-6 py-2 rounded-2xl transition-all"
          onClick={downloadPDFFiltered}
          >
            <DownloadIcon/> </button>
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
                      <td className="py-4 px-6 hover:cursor-pointer hover:bg-gray-100"
                      onClick={() => {handleCheckinOpenModal(entry)
                        // setNewCheckinTime(entry.check_in)
                      }                     
                      }
                      >{entry.check_in}</td>
                      <td className="py-4 px-6 hover:cursor-pointer hover:bg-gray-100" 
                      onClick={() => {handleOpenModal(entry)
                        // setNewCheckOutTime(entry.check_out)
                      }                     
                      }                    
                      > {`${entry.check_out}`}
                      {entry.autocheckout ? (
                  <div className="relative inline-block">
                    <span
                      className="text-yellow-600 bg-yellow-100 px-2 py-1 font-semibold rounded-xl ml-2 cursor-pointer"
                      // onMouseEnter={(e) => {
                      //   const tooltip = e.target.nextSibling;
                      //   tooltip.classList.remove('hidden');
                      // }}
                      // onMouseLeave={(e) => {
                      //   const tooltip = e.target.nextSibling;
                      //   tooltip.classList.add('hidden');
                      // }}
                    >
                      Auto
                    </span>
                    {/* Tooltip */}
                    <div className="hidden absolute bg-gray-400 text-white text-sm px-2 py-1 w-max rounded mt-1 -ml-2">
                      Change CheckOut Time
                    </div>
                  </div>
                ) : null}
                      </td>
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
           
          {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Change CheckOut Time</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">New CheckOut Time</label>

        {/* Time Picker Container */}
        <div className="time-picker-container">
          <div className="clock bg-gray-100 p-4 rounded-lg shadow-md">
            <div className="time-display text-4xl font-bold text-center text-gray-800 mb-4">
            <span>{hour.toString().padStart(2, '0').slice(0, 2)}:</span>
           <span>{minute.toString().padStart(2, '0').slice(0, 2)}</span>

            </div>

            {/* AM/PM Toggle */}
            <div className="am-pm-toggle flex justify-center space-x-4">
              <button
                onClick={toggleAMPM}
                className={`am-pm-btn px-4 py-2 rounded-full text-lg ${isAM ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              >
                AM
              </button>
              <button
                onClick={toggleAMPM}
                className={`am-pm-btn px-4 py-2 rounded-full text-lg ${!isAM ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Input Section for Hour and Minute */}
          <div className="input-section grid grid-cols-2 gap-4 mt-6">
            <div className="input-group">
              <label className="text-sm font-medium text-gray-700">Hour</label>
              <div className="relative">
                <input
                  type="number"
                  value={hour}
                  onChange={handleHourChange}
                  min="1"
                  max="12"
                  onInput={(e) => {
                    // Ensure the input is only a 2-digit number
                    const value = e.target.value;
                    if (value.length > 2) {
                      e.target.value = value.slice(0, 2);  // Trim to 2 digits if more than 2 characters
                    }
                  }}
                  className="input px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleHourChange({ target: { value: Math.min(12, hour + 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8593;
                  </button>
                  <button
                    onClick={() => handleHourChange({ target: { value: Math.max(1, hour - 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8595;
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="text-sm font-medium text-gray-700">Minute</label>
              <div className="relative">
                <input
                  type="number"
                  value={minute}
                  onChange={handleMinuteChange}
                  min="0"
                  max="59"
                  onInput={(e) => {
                    // Ensure the input is only a 2-digit number
                    const value = e.target.value;
                    if (value.length > 2) {
                      e.target.value = value.slice(0, 2);  // Trim to 2 digits if more than 2 characters
                    }
                  }}
                  className="input px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleMinuteChange({ target: { value: Math.min(59, minute + 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8593;
                  </button>
                  <button
                    onClick={() => handleMinuteChange({ target: { value: Math.max(0, minute - 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8595;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleCloseModal}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateCheckOutTime}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg ml-4 hover:bg-blue-600 transition"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}



 {/* Checkin Time Changing Model */}
{isCheckinModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Change CheckIn Time</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">New CheckIn Time</label>

        {/* Time Picker Container */}
        <div className="time-picker-container">
          <div className="clock bg-gray-100 p-4 rounded-lg shadow-md">
            <div className="time-display text-4xl font-bold text-center text-gray-800 mb-4">
            <span>{hourin.toString().padStart(2, '0').slice(0, 2)}:</span>
            <span>{minutein.toString().padStart(2, '0').slice(0, 2)}</span>
            </div>

            {/* AM/PM Toggle */}
            <div className="am-pm-toggle flex justify-center space-x-4">
              <button
                onClick={togglecheckinAMPM}
                className={`am-pm-btn px-4 py-2 rounded-full text-lg ${isinAM ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              >
                AM
              </button>
              <button
                onClick={togglecheckinAMPM}
                className={`am-pm-btn px-4 py-2 rounded-full text-lg ${!isinAM ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Input Section for Hour and Minute */}
          <div className="input-section grid grid-cols-2 gap-4 mt-6">
            <div className="input-group">
              <label className="text-sm font-medium text-gray-700">Hour</label>
              <div className="relative">
                <input className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
                  type="number"
                  value={hourin}
                  onChange={handleCheckInHourChange}
                  max="12"
                  min="01"
                  onInput={(e) => {
                    // Ensure the input is only a 2-digit number
                    const value = e.target.value;
                    if (value.length > 2) {
                      e.target.value = value.slice(0, 2);  // Trim to 2 digits if more than 2 characters
                    }
                  }}
                  // className="input px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleCheckInHourChange({ target: { value: Math.min(12, hourin + 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8593;
                  </button>
                  <button
                    onClick={() => handleCheckInHourChange({ target: { value: Math.max(1, hourin - 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8595;
                  </button>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="text-sm font-medium text-gray-700">Minute</label>
              <div className="relative">
                <input
                  type="number"
                  value={minutein}
                  onChange={handleCheckInMinuteChange}
                  min="0"
                  max="59"
                  onInput={(e) => {
                    // Ensure the input is only a 2-digit number
                    const value = e.target.value;
                    if (value.length > 2) {
                      e.target.value = value.slice(0, 2);  // Trim to 2 digits if more than 2 characters
                    }
                  }}
                  className="input px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleCheckInMinuteChange({ target: { value: Math.min(59, minutein + 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8593;
                  </button>
                  <button
                    onClick={() => handleCheckInMinuteChange({ target: { value: Math.max(0, minutein - 1) } })}
                    className="text-xl text-gray-600 w-4 hover:text-blue-500"
                  >
                    &#8595;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleCheckInCloseModal}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateCheckInTime}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg ml-4 hover:bg-blue-600 transition"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}




    </>
      )}

      {/* Monthly View */}
      {!loading && selectedTab === "Monthly" && (
          <EmployeeMonthlyAttendanceTable 
            selectedDateM={selectedDateM}          
              />
             
              )}
      {!loading && selectedTab === "Weekly" && <EmployeeWeeklyAttendanceTable selectedDateW={selectedDateW} />}
      {!loading && selectedTab === "Filter" && <FilteredDataAdmin search={search} startdate={startdate} enddate={enddate} />}
    </div>
  );
};

export default EmployeeAttendanceTable;