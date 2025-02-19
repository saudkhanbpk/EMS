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
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0]; // Format today's date (YYYY-MM-DD)
    
    // Define time range for today
    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;

    // If today is a weekend, exit the function
    if (!isWorkingDay(now)) {
      console.log("Today is not a working day. Skipping...");
      return;
    }

    // Fetch all users from the 'users' table
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }

    // Fetch today's attendance logs
    const { data: attendanceLogs, error: attendanceError } = await supabase
      .from('attendance_logs')
      .select('*')
      .gte('check_in', startOfDay)
      .lt('check_in', endOfDay);

    if (attendanceError) {
      console.error("Error fetching attendance logs:", attendanceError);
      return;
    }

    // Fetch today's absentee records
    const { data: absenteeRecords, error: absenteeError } = await supabase
      .from('absentees')
      .select('*')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (absenteeError) {
      console.error("Error fetching absentee records:", absenteeError);
      return;
    }

    // Convert attendance and absentee records into maps for easy lookup
    const attendanceMap = new Map(attendanceLogs.map(log => [log.user_id, log]));
    const absenteeMap = new Map(absenteeRecords.map(record => [record.user_id, record]));

    // Loop through each user
    for (const user of users) {
      const userAttendance = attendanceMap.get(user.id);
      const absenteeRecord = absenteeMap.get(user.id);

      if (!userAttendance) {
        // If user has no attendance record and is not already marked absent, mark as full-day absent
        if (!absenteeRecord) {
          console.log(`User ${user.id} is absent for Full Day.`);
          await supabase.from('absentees').insert([
            { user_id: user.id, absentee_type: "Absent", absentee_Timing: "Full Day" }
          ]);
        }
      } else if (userAttendance.check_in && !userAttendance.check_out) {
        // If user has checked in but not checked out, mark as half-day absent
        if (!absenteeRecord) {
          console.log(`User ${user.id} is absent for Half Day.`);
          await supabase.from('absentees').insert([
            { user_id: user.id, absentee_type: "Absent", absentee_Timing: "Half Day" }
          ]);
        }
      } else {
        console.log(`User ${user.id} has both check-in and check-out. No action needed.`);
      }
    }

    console.log("FetchUsers script executed successfully.");
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

// Run the function
fetchUsers();
