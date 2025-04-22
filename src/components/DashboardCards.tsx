import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { startOfYear, endOfYear } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../lib/store";

// Define leave types with initial values and limits
const initialLeaveData = [
  { type: "Casual Leave", used: 0, total: 22, color: "#3498db" },
  { type: "Sick Leave", used: 0, total: 22, color: "#24B12B" },
  { type: "Unpaid Leave", used: 0, total: 22, color: "#FF355C" },
  { type: "Remote Work", used: 0, total: 22, color: "#C78E2C" },
  { type: "Emergency Leave", used: 0, total: 22, color: "#9A00FF" },
];

// Total shared leave pool (excluding Remote Work)
const TOTAL_SHARED_LEAVE = 22;

export default function DashboardCards() {
  const [selectedDate] = useState(new Date());
  const [leaveData, setLeaveData] = useState(initialLeaveData);
  const currentUser = useAuthStore((state) => state.user);
  
  // Get start and end of the current year
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);

  async function fetchAbsentees() {
    try {
      const { data, error } = await supabase
        .from('absentees')
        .select('*')
        .eq('user_id', currentUser?.id || localStorage.getItem('user_id'))
        .gte('created_at', yearStart.toISOString())
        .lte('created_at', yearEnd.toISOString());
      
      if (error) {
        console.error('Error fetching absentees:', error);
        return;
      }
      
      console.log("the all absentees for the person", data);
      
      if (data) {
        processAbsenteeData(data);
      }
    } catch (err) {
      console.error('Failed to fetch absentees:', err);
    }
  }
  
  // Process absentee data and update leave counts
  function processAbsenteeData(absenteeData) {
    // Create a copy of the initial leave data
    const updatedLeaveData = JSON.parse(JSON.stringify(initialLeaveData));
    
    // Track total casual and sick leaves to determine if we need to add to unpaid
    let casualLeaveCount = 0;
    let sickLeaveCount = 0;
    let emergencyLeaveCount = 0;
    let halfDayCount = 0;
    let remoteWorkCount = 0;
    
    // Process each absentee record
    absenteeData.forEach(record => {
      switch(record.absentee_Timing) {
        case "Full Day":
          casualLeaveCount++;
          break;
        case "Sick Leave":
          sickLeaveCount++;
          break;
        case "Half Day":
          halfDayCount++;
          break;
        case "Emergency Leave":
          emergencyLeaveCount++;
          break;
        case "Remote Work":
          remoteWorkCount++;
          break;
        default:
          // Handle any other types if needed
          break;
      }
    });
    
    // Convert half days to casual leaves (2 half days = 1 casual leave)
    const additionalCasualLeaves = Math.floor(halfDayCount / 2);
    casualLeaveCount += additionalCasualLeaves;
    
    // Remaining half day (if odd number of half days)
    const remainingHalfDay = halfDayCount % 2;
    
    // Calculate total leave days used (excluding Remote Work)
    const totalLeaveUsed = casualLeaveCount + sickLeaveCount + emergencyLeaveCount;
    
    // Calculate how many days are available in the shared pool
    const availableLeave = Math.max(0, TOTAL_SHARED_LEAVE - totalLeaveUsed);
    
    // Calculate how many days exceed the shared pool (going to unpaid)
    const unpaidLeaveCount = Math.max(0, totalLeaveUsed - TOTAL_SHARED_LEAVE);
    
    // Update casual leave count
    const casualLeaveIndex = updatedLeaveData.findIndex(item => item.type === "Casual Leave");
    if (casualLeaveIndex !== -1) {
      updatedLeaveData[casualLeaveIndex].used = casualLeaveCount;
      // Add a note about half days if there's a remaining one
      if (remainingHalfDay > 0) {
        updatedLeaveData[casualLeaveIndex].note = `+ ${remainingHalfDay} half day`;
      }
    }
    
    // Update sick leave count
    const sickLeaveIndex = updatedLeaveData.findIndex(item => item.type === "Sick Leave");
    if (sickLeaveIndex !== -1) {
      updatedLeaveData[sickLeaveIndex].used = sickLeaveCount;
    }
    
    // Update emergency leave count
    const emergencyLeaveIndex = updatedLeaveData.findIndex(item => item.type === "Emergency Leave");
    if (emergencyLeaveIndex !== -1) {
      updatedLeaveData[emergencyLeaveIndex].used = emergencyLeaveCount;
    }
    
    // Update remote work count (not part of the shared pool)
    const remoteWorkIndex = updatedLeaveData.findIndex(item => item.type === "Remote Work");
    if (remoteWorkIndex !== -1) {
      updatedLeaveData[remoteWorkIndex].used = remoteWorkCount;
    }
    
    // Update unpaid leave count
    const unpaidLeaveIndex = updatedLeaveData.findIndex(item => item.type === "Unpaid Leave");
    if (unpaidLeaveIndex !== -1) {
      updatedLeaveData[unpaidLeaveIndex].used = unpaidLeaveCount;
    }
    
    // Update the shared available count for all leave types (except Remote Work and Unpaid)
    updatedLeaveData.forEach(item => {
      if (item.type !== "Remote Work" && item.type !== "Unpaid Leave") {
        item.available = availableLeave;
      }
    });
    
    // Update the state with the new leave data
    setLeaveData(updatedLeaveData);
  }
  
  useEffect(() => {
    if (currentUser) {
      fetchAbsentees();
    }
  }, [currentUser, selectedDate]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 mb-6 mt-2">
      {leaveData.map((leave, index) => (
        <div
          key={index}
          className="bg-white p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <h2
            className="text-sm sm:text-base font-semibold text-left leading-5 mb-2 sm:mb-3"
            style={{ color: leave.color }}
          >
            {leave.type}
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="w-12 sm:w-14 md:w-16">
              <CircularProgressbar
                counterClockwise
                value={(leave.used / leave.total) * 100}
                text={leave.type === "Unpaid Leave" ? `${leave.used}` : `${leave.used}/${leave.total}`}
                styles={buildStyles({
                  textColor: leave.color,
                  pathColor: leave.color,
                  trailColor: "#e5e7eb",
                  textSize: "24px",
                })}
              />
            </div>
            <div className="font-medium text-[#344054] text-[8px] sm:text-[10px]">
              {leave.type !== "Unpaid Leave" ? (
                <>
                  <p className="mb-1">
                    Available: {leave.type !== "Remote Work" ? 
                      (leave.available !== undefined ? leave.available : TOTAL_SHARED_LEAVE - leave.used) : 
                      (leave.total - leave.used)}
                  </p>
                  <p>Used: {leave.used} {leave.note && <span>({leave.note})</span>}</p>
                </>
              ) : (
                <p>Total: {leave.used}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}