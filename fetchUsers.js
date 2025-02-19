import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection to the Supabase database
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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
  
      // Array to store results instead of directly updating the database
      let attendanceResults = [];
  
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
          attendanceResults.push({ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Full Day" });
          continue;
        }
  
        // Case 2: User has check-in but no check-out
        if (userAttendance.check_in && !userAttendance.check_out) {
          console.log(`User ${user.id} has checked in but no check-out.`);
  
          if (existingAbsentee) {
            console.log(`User ${user.id} is already marked for absenteeism. Skipping...`);
            continue;
          }
  
          console.log(`Marking user ${user.id} as absent for Half Day.`);
          attendanceResults.push({ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Half Day" });
          continue;
        }
  
        // Case 3: User has both check-in and check-out (No action needed)
        if (userAttendance.check_in && userAttendance.check_out) {
          console.log(`User ${user.id} has both check-in and check-out. No action needed.`);
          attendanceResults.push({ user_id: user.id, absentee_type: "Not Absent" });
          continue;
        }
      }
  
      // Remove duplicate entries based on user_id
      const uniqueResults = [];
      const seenUserIds = new Set();
  
      attendanceResults.forEach(record => {
        if (!seenUserIds.has(record.user_id)) {
          seenUserIds.add(record.user_id);
          uniqueResults.push(record);
        }
      });
  
      // Remove "Not Absent" users and create a new array
      const finalAbsentees = uniqueResults.filter(record => record.absentee_type !== "Not Absent");
  
      // Log final absent users
      console.log("Final Absent Users Data:", finalAbsentees);
  
      // Update database with final absentee data
      if (finalAbsentees.length > 0) {
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