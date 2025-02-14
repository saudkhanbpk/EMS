import React from "react";
import { useState, useEffect } from "react";
import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
import { toDate } from "date-fns";


interface AbsenteesData {
  id: string;
  user_id: string;
  date: string;
  type: string;
  timing: string;
}

const AbsenteesData = () => {
    const [absenteeData, setAbsenteeData] = useState<any[]>([]);
    const [attendanceRecord, setAttendanceRecord] = useState<any[]>([]);
    const [todayAbsentee , setTodayAbsentee] = useState<any[]>([]);
    let user = localStorage.getItem('user_id');

    useEffect(() => async () => {
    
             //   // Getting Absentees Data
             const { data: absenteeData, error: absenteeError } = await withRetry(() =>
               supabase
                 .from('absentees')
                 .select('*')
                 .eq('user_id', user)
             );
             if (absenteeError) throw absenteeError;
            if (absenteeData) setAbsenteeData(absenteeData);
            console.log("Absentee Data", absenteeData);
            
            }, []);


           // Function to check time and run the absentee update function once after 6 PM
const checkAndRunOnce = () => {
  const now = new Date();
  const pkTimeOffset = 5 * 60 * 60 * 1000; // Pakistan Time (UTC+5)
  const pkNow = new Date(now.getTime() + pkTimeOffset); // Convert to PK Time

  const hours = pkNow.getUTCHours(); // Get hours in PK time
  const minutes = pkNow.getUTCMinutes();

  if (hours === 18 && minutes === 0) { // Run exactly at 6:00 PM
    console.log("Running function after 6 PM PKT...");
    UpdateAbsentee(); // Call your function
    clearInterval(checkTimeInterval); // Stop checking after execution
  }
};

// Check every minute until 6 PM
const checkTimeInterval = setInterval(checkAndRunOnce, 60 * 1000);

// Function to update absentee data
const UpdateAbsentee = async () => {
  try {
    const { data: records, error: recordsError } = await withRetry(() =>
      supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', localStorage.getItem('user_id'))
    );

    if (recordsError) throw recordsError;
    
    console.log("Attendance Records", records);
    
    if (records && records.length > 0) {
      setAttendanceRecord(records);
    }
  } catch (error) {
    console.error("Error updating absentee records:", error);
  }
};

            
           
    return <div>
           <div className="flex flex-col items-center justify-between">
              <div className="grid grid-cols-3 gap-14 bg-gray-50 rounded-lg p-4 w-full">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 text-left  mb-3">Date</h3>
                  <span className="font-sm ">
                  {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p>{(absentee.created_at)}</p>
                     </div>
                   ))}
                    </span>
                </div>
                <div>
                 <h3 className="text-sm font-medium text-gray-500 text-left  mb-3">Type</h3>
                 <span className="font-sm ">
                 {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p>{absentee.absentee_type}</p>
                     </div>
                   ))}
                    </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 text-left   mb-3">Timing</h3>
                  <span className="font-sm ">
                  {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p>{absentee.absentee_type}</p>
                     </div>
                   ))}
                    </span>
                </div>  

              </div>
            </div>
    </div>
}
export default AbsenteesData;