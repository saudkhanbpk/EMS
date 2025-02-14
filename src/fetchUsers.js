import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const withRetry = async (fn, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
    }
  }
};

const isWorkingDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Skip weekends
};

const fetchUsers = async () => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const startOfDay = `${todayDate}T00:00:00.000Z`;
    const endOfDay = `${todayDate}T23:59:59.999Z`;

    if (!isWorkingDay(now)) {
      console.log("Today is not a working day. Skipping...");
      return;
    }

    // Fetch all users
    const { data: users, error: usersError } = await withRetry(() =>
      supabase.from('users').select('*')
    );
    if (usersError) throw usersError;

    // Fetch attendance logs for today
    const { data: attendanceLogs, error: attendanceError } = await withRetry(() =>
      supabase.from('attendance_logs')
        .select('*')
        .gte('check_in', startOfDay)
        .lt('check_in', endOfDay)
    );
    if (attendanceError) throw attendanceError;

    // Fetch absentee records for today
    const { data: absenteeRecords, error: absenteeError } = await withRetry(() =>
      supabase.from('absentees')
        .select('*')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
    );
    if (absenteeError) throw absenteeError;

    // Convert to maps for faster lookup
    const attendanceMap = new Map(attendanceLogs.map(log => [log.user_id, log]));
    const absenteeMap = new Map(absenteeRecords.map(record => [record.user_id, record]));

    for (const user of users) {
      const userAttendance = attendanceMap.get(user.id);
      const absenteeRecord = absenteeMap.get(user.id);

      if (!userAttendance) {
        if (!absenteeRecord) {
          console.log(`User ${user.id} is absent for Full Day.`);
          await withRetry(() =>
            supabase.from('absentees').insert([{ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Full Day" }])
          );
        }
      } else if (userAttendance.check_in && !userAttendance.check_out) {
        if (!absenteeRecord) {
          console.log(`User ${user.id} is absent for Half Day.`);
          await withRetry(() =>
            supabase.from('absentees').insert([{ user_id: user.id, absentee_type: "Absent", absentee_Timing: "Half Day" }])
          );
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

fetchUsers();
