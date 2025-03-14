import React from "react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { startOfMonth , endOfMonth } from "date-fns";

const MonthlyDataUser = ({selectedDate , selectedtab}) => {
const [Attendance , setAttendance] = useState([]);
const [absentees , setabsentees] = useState([]);
const [breaks , setbreaks] = useState([]);
const [Error , setError] = useState("");
const [loading , setLoading] = useState(false);
const [Monthlydata , setMonthlyData] = useState([]);

const userID = localStorage.getItem("user_id")
const monthstart = startOfMonth(selectedDate);
const monthEnd = endOfMonth(selectedDate); 
const monthName = selectedDate.toLocaleString('default', { month: 'long' });
const year = selectedDate.getFullYear();

useEffect( () => {
   
    const fetchattendance = async () => {
        const {data:attendanceData , error: attendanceerror} = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id" , userID)
        .gte("created_at" , monthstart.toISOString())
        .lte("created_at" , monthEnd.toISOString());

        if (attendanceerror) return setError(attendanceerror);
        setAttendance(attendanceData);
    }

    const fetchabsentees = async () => {
        const {data:absenteesData , error:absenteesError} = await supabase 
        .from("absentees")
        .select("*")
        .eq("user_id" , userID)
        .gte("created_at" , monthstart.toISOString())
        .lte("created_at" , monthEnd.toISOString());

        if(absenteesError) return setError(absenteesError)
            setabsentees(absenteesData);
    }

    const fetchbreaks = async () => {
        const {data:breaksData , error:breaksError} = await supabase 
        .from("breaks")
        .select("*")
        .eq("user_id" , userID)
        .gte("created_at" , monthstart.toISOString())
        .lte("created_at" , monthEnd.toISOString());

        if(breaksError) return setError(breaksError)
            setbreaks(breaksData);
    }

    if (selectedtab === "Monthlydata") {
    fetchattendance();
    fetchabsentees();
    fetchbreaks();
    }
}, [selectedtab, userID])  

// useEffect(() => {
//     if (!Attendance.length && !absentees.length) return;

//     const newMonthlyData = [];
// //   if (!Attendance) return;
//     // Process Attendance Data
//     Attendance.forEach((entry) => {
//             const checkInTime = new Date(entry.check_in).toLocaleTimeString("en-US", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true, // Use `false` for 24-hour format
//             });
        
//             const checkOutTime = entry.check_out
//                 ? new Date(entry.check_out).toLocaleTimeString("en-US", {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                     hour12: true,
//                 })
//                 : "N/A";
//         newMonthlyData.push({
//             date: entry.check_in.split("T")[0], 
//             checkIn: checkInTime,
//             checkOut: checkOutTime || "N/A",
//             status: entry.status,
//             work_mode: entry.work_mode || "N/A",
//         });
//     });
    
//     if (!absentees) return;
//     // Process Absentees Data
//     absentees.forEach((entry) => {
//         newMonthlyData.push({
//             date: entry.created_at.split("T")[0],  
//             checkIn: "N/A",
//             checkOut: "N/A",
//             status: "Absent",
//             work_mode: "----",
//         });
//     });

//     setMonthlyData(newMonthlyData);
//     // console.log("Weekly Data",newWeeklyData);
// }, [Attendance, absentees]);

useEffect(() => {
    if (!Attendance.length && !absentees.length) return;

    const newMonthlyData = [];

    // Create a map to store data by date
    const dataByDate = new Map();

    // Process Attendance Data
    Attendance.forEach((entry) => {
        const date = entry.check_in.split("T")[0]; // Extract the date
        const checkInTime = new Date(entry.check_in).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true, // Use `false` for 24-hour format
        });

        const checkOutTime = entry.check_out
            ? new Date(entry.check_out).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })
            : "N/A";

        // Add or update the entry for this date
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
        const date = entry.created_at.split("T")[0]; // Extract the date

        // If there's already an attendance entry for this date, skip adding the absentee entry
        if (dataByDate.has(date)) {
            return;
        }

        // Add the absentee entry for this date
        dataByDate.set(date, {
            date,
            checkIn: "N/A",
            checkOut: "N/A",
            status: "Absent",
            work_mode: "----",
        });
    });

    // Convert the map values to an array
    const mergedData = Array.from(dataByDate.values());

    // Sort the data by date (optional)
    mergedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Update the state
    setMonthlyData(mergedData);
}, [Attendance, absentees]);




    return(
        <>
        <div>
            <h3 className="mb-3 font-semibold text-xl text-gray-900">Weekly Overview - {monthName+ " " + year}</h3>
        </div>
        <div className="width-full bg-red rounded-3xl shadow-lg max-w-5xl">
        {Error && <p className="text-red-500 text-center">No Attendance Record Found</p>}
         <div className="overflow-x-auto rounded-2xl">
            <table className="min-w-full   bg-white">
            <thead className="bg-gray-50 p-4 text-gray-900  font-semibold  text-md leading-normal">
              <td className="px-3 py-6 text-center">Date</td>
              <td className="px-3 py-6 text-center">Check-In</td>
              <td className="px-3 py-6 text-center">Check-Out</td>
              <td className="px-3 py-6 text-center">Work Mode</td>
              <td className="px-3 py-6 text-center">Status</td>

            </thead>
            <tbody>
                {Monthlydata && Monthlydata.length > 0 ? (
                Monthlydata.map((data, index) => (
                <tr key={index} className="text-gray-700">
                <td className="px-3 py-4 text-center">{data.date}</td> 
                <td className="px-3 py-4 text-center">{data.checkIn}</td> 
                <td className="px-3 py-4 text-center">{data.checkOut}</td> 
                {/* <td className="px-3 py-4 text-center">{data.work_mode}</td>  */}
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
                          {data.work_mode === "on_site" ? "On-site" : data.work_mode === "remote" ? "Remote" : "-----"}
                        </span>
                      </td>
                {/* <td className="px-3 py-4 text-center">{data.status}</td>  */}
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
                
                </tr>
               ))            
             ) : (
               <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-4">
                    No Data Available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
         </div>
        </div>

        </>
    )
};
export default MonthlyDataUser;
