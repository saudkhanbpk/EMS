import React, { useState, useEffect } from "react";
import { supabase, withRetry } from '../lib/supabase';

const AbsenteeComponent = () => {
  const [users, setUsers] = useState<any[]>([]);
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];
  const startOfDay = `${todayDate}T00:00:00.000Z`;
  const endOfDay = `${todayDate}T23:59:59.999Z`;

  const isWorkingDay = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;  // Skip weekends (Sunday & Saturday)
  };

  const FetchUsers = async () => {
    try {
      // Fetch all users at once
      const { data: users, error: usersError } = await withRetry(() =>
        supabase.from('users').select('*')
      );
      if (usersError) throw usersError;
      setUsers(users);

      // Fetch attendance logs for today for all users at once
      const { data: attendanceLogs, error: attendanceError } = await withRetry(() =>
        supabase
          .from('attendance_logs')
          .select('*')
          .gte('check_in', startOfDay)
          .lt('check_in', endOfDay)
      );
      if (attendanceError) throw attendanceError;

      // Fetch absentee records for today for all users at once
      const { data: absenteeRecords, error: absenteeError } = await withRetry(() =>
        supabase
          .from('absentees')
          .select('*')
          .gte('created_at', startOfDay)
          .lt('created_at', endOfDay)
      );
      if (absenteeError) throw absenteeError;

      // Convert attendance logs & absentees into maps for faster lookup
      const attendanceMap = new Map();
      attendanceLogs?.forEach((log) => {
        attendanceMap.set(log.user_id, log);
      });

      const absenteeMap = new Map();
      absenteeRecords?.forEach((record) => {
        absenteeMap.set(record.user_id, record);
      });

      // Process users in one loop
      for (const user of users) {
        const userAttendance = attendanceMap.get(user.id);
        const absenteeRecord = absenteeMap.get(user.id);

        // Skip non-working days
        if (!isWorkingDay(now)) {
          console.log("Today is not a working day. Skipping...");
          continue;
        }

        if (!userAttendance) {
          // No check-in found => Mark Absent (Full Day)
          if (!absenteeRecord) {
            console.log(`User ${user.id} is absent for Full Day.`);
            await withRetry(() =>
              supabase.from('absentees').insert([
                {
                  user_id: user.id,
                  absentee_type: "Absent",
                  absentee_Timing: "Full Day",
                }
              ])
            );
          }
        } else if (userAttendance.check_in && !userAttendance.check_out) {
          // Check-in exists but check-out missing => Mark Absent (Half Day)
          if (!absenteeRecord) {
            console.log(`User ${user.id} is absent for Half Day.`);
            await withRetry(() =>
              supabase.from('absentees').insert([
                {
                  user_id: user.id,
                  absentee_type: "Absent",
                  absentee_Timing: "Half Day",
                }
              ])
            );
          }
        } else {
          console.log(`User ${user.id} has both check-in and check-out. No action needed.`);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };






  
//   //Fetch Attendance Data And Ckeck if the User has Not checked Out , then Count His Half Day in Absentees
//   const FetchAttendance = async () => {
//     const { data: records, error: recordsError } = await withRetry(() => 
//         supabase
//             .from('attendance_logs')
//             .select('*')
//             .gte("check_in", startOfDay) 
//             .lt("check_in", endOfDay)
//     );

//     if (recordsError) {
//         console.error("Error fetching attendance records:", recordsError);
//         return;
//     }

//     console.log("Today's Attendance Records:", records);

   
//     }

   
// };

  useEffect(() => {
    FetchUsers();
  }, []);

















             // Function to check time and run the absentee update function once after 6 PM
// const checkAndRunOnce = () => {
//   const now = new Date();
//   const pkTimeOffset = 5 * 60 * 60 * 1000; // Pakistan Time (UTC+5)
//   const pkNow = new Date(now.getTime() + pkTimeOffset); // Convert to PK Time

//   const hours = pkNow.getUTCHours(); // Get hours in PK time
//   const minutes = pkNow.getUTCMinutes();

//   if (hours === 18 && minutes === 0) { // Run exactly at 6:00 PM
//     console.log("Running function after 6 PM PKT...");
//     UpdateAbsentee(); // Call your function
//     clearInterval(checkTimeInterval); // Stop checking after execution
//   }
// };

// Check every minute until 6 PM
            
           
    return <div>
           <div className="flex flex-col items-center justify-between">
              <div className="grid grid-cols-3 gap-14 bg-gray-50 rounded-lg p-4 w-full">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 text-left  mb-3">Date</h3>
                  <span className="font-sm ">
                  {/* {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p  className="text-gray-700">{new Date(absentee.created_at).toLocaleString('en-us' , {
                        month : 'short' ,
                        year: 'numeric',
                        day: 'numeric'
                       })}</p>
                     </div>
                   ))} */}
                    </span>
                </div>
                <div>
                 <h3 className="text-sm font-medium text-gray-500 text-left ml-4  mb-3">Type</h3>
                 <span className="font-sm ">
                 {/* {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p className="text-gray-700 ml-4">{absentee.absentee_type}</p>
                     </div>
                   ))} */}
                    </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 text-left  ml-4 mb-3">Timing</h3>
                  <span className="font-sm ">
                  {/* {absenteeData.map((absentee: any, index: number) => (
                     <div key={index}>
                       <p className="text-gray-700 ml-4">{absentee.absentee_Timing}</p>
                     </div>
                   ))} */}
                    </span>
                </div>  

              </div>
            </div>
    </div>
}
export default AbsenteeComponent;