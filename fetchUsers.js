// import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// dotenv.config();

// // Create a connection to the Supabase database
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// // Function to check if today is a working day (Monday - Friday)
// const isWorkingDay = (date) => {
//   const day = date.getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
//   return day !== 0 && day !== 6; // Return true if it's not Saturday or Sunday
// };

  
//   const fetchUsers = async () => {
//     try {
//       console.log("Fetching users...");
  
//       // Get today's date range
//       const now = new Date();
//       const todayDate = now.toISOString().split('T')[0];
//       const startOfDay = `${todayDate}T00:00:00.000Z`;
//       const endOfDay = `${todayDate}T23:59:59.999Z`;
  
//       // Fetch all users
//       const { data: users, error: usersError } = await supabase.from('users').select('*');
//       if (usersError) throw usersError;
  
//       console.log(`Total users fetched: ${users.length}`);
  
//       // Fetch all today's attendance records
//       const { data: attendanceLogs, error: attendanceError } = await supabase
//         .from('attendance_logs')
//         .select('*')
//         .gte('check_in', startOfDay)
//         .lt('check_in', endOfDay);
//       if (attendanceError) throw attendanceError;
  
//       // Fetch all today's absentee records
//       const { data: absentees, error: absenteeError } = await supabase
//         .from('absentees')
//         .select('*')
//         .gte('created_at', startOfDay)
//         .lt('created_at', endOfDay);
//       if (absenteeError) throw absenteeError;
  
//       // Array to store results instead of directly updating the database
//       let attendanceResults = [];
  
//       // Loop through each user
//       for (const user of users) {
//         console.log(`Processing user: ${user.id}`);
  
//         // Find user's attendance for today
//         const userAttendance = attendanceLogs.find(log => log.user_id === user.id);
  
//         // Check if the user is already marked absent
//         const existingAbsentee = absentees.find(absent => absent.user_id === user.id);
  
//         // Case 1: User has NO check-in record
//         if (!userAttendance) {
//           console.log(`User ${user.id} has no check-in record.`);
  
//           if (existingAbsentee) {
//             console.log(`User ${user.id} is already marked absent. Skipping...`);
//             continue;
//           }
  
//           console.log(`Marking user ${user.id} as absent for Full Day.`);
//           attendanceResults.push({ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Full Day" });
//           continue;
//         }
  
//         // Case 2: User has check-in but no check-out
//         if (userAttendance.check_in && !userAttendance.check_out) {
//           console.log(`User ${user.id} has checked in but no check-out.`);
  
//           if (existingAbsentee) {
//             console.log(`User ${user.id} is already marked for absenteeism. Skipping...`);
//             continue;
//           }
  
//           console.log(`Marking user ${user.id} as absent for Half Day.`);
//           attendanceResults.push({ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Half Day" });
//           continue;
//         }
  
//         // Case 3: User has both check-in and check-out (No action needed)
//         if (userAttendance.check_in && userAttendance.check_out) {
//           console.log(`User ${user.id} has both check-in and check-out. No action needed.`);
//           attendanceResults.push({ user_id: user.id, absentee_type: "Not Absent" });
//           continue;
//         }
//       }
  
//       // Remove duplicate entries based on user_id
//       const uniqueResults = [];
//       const seenUserIds = new Set();
  
//       attendanceResults.forEach(record => {
//         if (!seenUserIds.has(record.user_id)) {
//           seenUserIds.add(record.user_id);
//           uniqueResults.push(record);
//         }
//       });
  
//       // Remove "Not Absent" users and create a new array
//       const finalAbsentees = uniqueResults.filter(record => record.absentee_type !== "Not Absent");
  
//       // Log final absent users
//       console.log("Final Absent Users Data:", finalAbsentees);
  
//       // Update database with final absentee data
//       if (finalAbsentees.length > 0) {
//         const { error: insertError } = await supabase.from('absentees').insert(finalAbsentees);
//         if (insertError) throw insertError;
//         console.log("Database updated successfully with absent users.");
//       } else {
//         console.log("No absent users to update in the database.");
//       }
  
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     }
//   };
  
//   // Call the function
//   fetchUsers();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection to the Supabase database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Function to check if today is a working day (Monday - Friday)
const isWorkingDay = (date) => {
  const day = date.getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
  return day !== 0 && day !== 6; // Return true if it's not Saturday or Sunday
};

const fetchUsers = async () => {
  try {
    console.log("Fetching users...");

    // Get today's date range
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;

    // Fetch all users
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;

    console.log(`Total users fetched: ${users.length}`);

    // Fetch all today's attendance records
    const { data: attendanceLogs, error: attendanceError } = await supabase
      .from('attendance_logs')
      .select('*')
      .gte('check_in', startOfDay)
      .lt('check_in', endOfDay);
    if (attendanceError) throw attendanceError;

    // Fetch all today's absentee records
    const { data: absentees, error: absenteeError } = await supabase
      .from('absentees')
      .select('*')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);
    if (absenteeError) throw absenteeError;

    // Arrays to store updates
    let attendanceUpdates = []; // For updating checkout times in attendance_logs
    let absenteeRecords = [];   // For inserting absentee records into absentees

    // Loop through each user
    for (const user of users) {
      console.log(`Processing user: ${user.id}`);

      // Find user's attendance for today
      const userAttendance = attendanceLogs.find(log => log.user_id === user.id);

      // Check if the user is already marked absent
      const existingAbsentee = absentees.find(absent => absent.user_id === user.id);

      // Case 1: User has NO check-in record
      if (!userAttendance) {
        console.log(`User ${user.id} has no check-in record.`);

        if (existingAbsentee) {
          console.log(`User ${user.id} is already marked absent. Skipping...`);
          continue;
        }

        console.log(`Marking user ${user.id} as absent for Full Day.`);
        absenteeRecords.push({ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Full Day" });
        continue;
      }

      // Case 2: User has check-in but no check-out
      if (userAttendance.check_in && !userAttendance.check_out) {
        console.log(`User ${user.id} has checked in but no check-out.`);

        // Debug: Log userAttendance
        console.log("User Attendance:", userAttendance);

        // Set the checkout time to 4:30 PM PKT (11:30 AM UTC)
        const checkoutTime = `${todayDate}T10:30:00.000Z`;

        // Add to attendanceUpdates array
        attendanceUpdates.push({
          id: userAttendance.id, // Unique ID of the attendance record
          check_out: checkoutTime, // New checkout time
          autocheckout: "yes" // Mark as auto-checkout
        });

        const sendNotification = async () => {
          try {
              const response = await fetch("http://localhost:4000/send-singlenotifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(
                    { title : "Auto Check Out" ,
                       body : "You are Checked Out Automatically for today on [4:30 PM] PKT",
                      fcmtoken: fcmtoken }
                      ) // Send title & body in request
              });
      
              const result = await response.json();
              console.log("Notification Response:", result);
          } catch (error) {
              console.error("Error sending notification:", error);
          }
      };
      
      // Example Call:
      sendNotification();

        console.log(`User ${user.id} checkout time will be updated to 4:30 PM PKT.`);
        continue;
      }

      // Case 3: User has both check-in and check-out (No action needed)
      if (userAttendance.check_in && userAttendance.check_out) {
        console.log(`User ${user.id} has both check-in and check-out. No action needed.`);
        absenteeRecords.push({ user_id: user.id, absentee_type: "Not Absent" });
        continue;
      }
    }

    // Remove duplicate entries based on user_id for absentee records
    const uniqueAbsenteeRecords = [];
    const seenUserIds = new Set();

    absenteeRecords.forEach(record => {
      if (!seenUserIds.has(record.user_id)) {
        seenUserIds.add(record.user_id);
        uniqueAbsenteeRecords.push(record);
      }
    });

    // Remove "Not Absent" users and create a new array
    const finalAbsentees = uniqueAbsenteeRecords.filter(record => record.absentee_type !== "Not Absent");

    // Log final absent users
    console.log("Final Absent Users Data:", finalAbsentees);

    // Perform batch updates for attendance logs
    if (attendanceUpdates.length > 0) {
      console.log("Updating attendance logs with checkout times...");
      for (const update of attendanceUpdates) {
        const { error: updateError } = await supabase
          .from('attendance_logs')
          .update({ check_out: update.check_out, autocheckout: "yes" })
          .eq('id', update.id);

        if (updateError) {
          console.error("Error updating attendance log:", updateError);
        } else {
          console.log(`Updated attendance log for user ${update.id}.`);
        }
      }
      console.log("Attendance logs updated successfully.");
    } else {
      console.log("No attendance logs to update.");
    }

    // Insert absentee records into the database
    if (finalAbsentees.length > 0) {
      console.log("Inserting absentee records into the database...");
      const { error: insertError } = await supabase.from('absentees').insert(finalAbsentees);
      if (insertError) throw insertError;
      console.log("Database updated successfully with absent users.");
    } else {
      console.log("No absent users to update in the database.");
    }

  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

// Call the function
fetchUsers();