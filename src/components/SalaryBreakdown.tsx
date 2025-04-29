import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import earningImage from './../assets/Dollar.png';
import deductImage from './../assets/6dfeac41f1caee5067c397ea655feda6.png';
import defaultUserProfile from './../assets/profile_breakdown.jpeg';

// Define types for better TypeScript support
interface EmployeeData {
  id: string;
  full_name: string;
  email?: string;
  profession?: string;
  salary?: string;
  per_hour_pay?: string;
  profile_image?: string;
  profile_image_url?: string;
  totalWorkingHours: string;
  totalOvertimeHours: string;
  overtimePay: string;
  totalEarnings: string;
  [key: string]: any; // Allow other properties
}

export default function SalaryBreakdown() {
  // Get the current user's ID from localStorage if no employeeid is provided in the URL
  const userId = localStorage.getItem("user_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [totalDeduction] = useState(7700); // Fixed deduction amount as per requirements

  // Fixed deduction values
  const extraLeaves = 5000;
  const checkInLate = 1200;
  const advancePay = 1500;

  useEffect(() => {
    // Add console logs for debugging
    console.log("SalaryBreakdown component mounted");
    console.log("User ID from localStorage:", localStorage.getItem("user_id"));
    console.log("Using user ID:", userId);

    if (userId) {
      fetchEmployeeData();
    } else {
      setError("No user ID found. Please log in again.");
      setLoading(false);
    }
  }, [userId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data for user ID:", userId);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        throw userError;
      }

      console.log("User data fetched successfully:", userData);

      // Fetch attendance data for working hours calculation
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("id, check_in, check_out")
        .eq("user_id", userId);

      if (attendanceError) {
        console.error("Error fetching attendance data:", attendanceError);
        throw attendanceError;
      }

      console.log("Attendance data fetched successfully, count:", attendanceData.length);

      // Check if there's any attendance data
      if (!attendanceData.length) {
        console.log("No attendance data found for this user");
        // Set employee data with default values
        setEmployeeData({
          ...userData,
          profile_image_url: userData.profile_image ?
            (userData.profile_image.startsWith("http") ?
              userData.profile_image :
              supabase.storage.from("profilepics").getPublicUrl(userData.profile_image).data.publicUrl) :
            defaultUserProfile,
          totalWorkingHours: "0.00",
          totalOvertimeHours: "0.00",
          overtimePay: "0.00",
          totalEarnings: userData.salary || "0.00"
        });
        setLoading(false);
        return;
      }

      // Fetch breaks data
      const { data: breakData, error: breakError } = await supabase
        .from("breaks")
        .select("start_time, end_time, attendance_id")
        .in("attendance_id", attendanceData.map(a => a.id));

      if (breakError) {
        console.error("Error fetching breaks data:", breakError);
        throw breakError;
      }

      console.log("Breaks data fetched successfully, count:", breakData.length);

      // Group breaks by attendance_id
      const breaksByAttendance = {};
      breakData.forEach(b => {
        if (!breaksByAttendance[b.attendance_id]) breaksByAttendance[b.attendance_id] = [];
        breaksByAttendance[b.attendance_id].push(b);
      });

      // Group attendance by date (taking the earliest record for each day)
      const attendanceByDate = {};
      attendanceData.forEach(log => {
        const date = new Date(log.check_in).toISOString().split('T')[0]; // Format: YYYY-MM-DD
        if (!attendanceByDate[date] || new Date(log.check_in) < new Date(attendanceByDate[date].check_in)) {
          attendanceByDate[date] = log;
        }
      });

      // Convert to array of unique attendance records (one per day)
      const uniqueAttendance = Object.values(attendanceByDate);

      // Calculate total working hours
      let totalRawWorkHours = 0;
      let totalBreakHours = 0;
      let totalNetWorkHours = 0;

      // First, calculate total raw hours without breaks
      uniqueAttendance.forEach(log => {
        const checkIn = new Date(log.check_in);
        const checkOut = log.check_out ? new Date(log.check_out) : new Date(checkIn.getTime());

        let hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        // Handle negative values by using Math.max(0, hoursWorked)
        hoursWorked = Math.max(0, hoursWorked);
        // Cap at 12 hours per day
        totalRawWorkHours += Math.min(hoursWorked, 12);
      });

      // Now calculate break hours and net working hours for each attendance record
      uniqueAttendance.forEach(log => {
        const checkIn = new Date(log.check_in);
        const checkOut = log.check_out ? new Date(log.check_out) : new Date(checkIn.getTime());

        let hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        // Handle negative values by using Math.max(0, hoursWorked)
        hoursWorked = Math.max(0, hoursWorked);

        // Calculate breaks for this attendance record
        const breaks = breaksByAttendance[log.id] || [];
        let breakHoursForThisLog = 0;

        breaks.forEach(b => {
          if (b.start_time) {
            const breakStart = new Date(b.start_time);
            // If end_time is missing, calculate only 1 hour of break
            const breakEnd = b.end_time
              ? new Date(b.end_time)
              : new Date(breakStart.getTime() + 1 * 60 * 60 * 1000); // 1 hour default

            const thisBreakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
            breakHoursForThisLog += thisBreakHours;
            totalBreakHours += thisBreakHours;
          }
        });

        // Calculate net hours for this log
        const netHoursForThisLog = Math.max(0, Math.min(hoursWorked - breakHoursForThisLog, 12));
        totalNetWorkHours += netHoursForThisLog;
      });

      // Fetch overtime hours from extrahours table
      const { data: extrahoursData, error: extrahoursError } = await supabase
        .from("extrahours")
        .select("id, check_in, check_out")
        .eq("user_id", userId);

      if (extrahoursError) {
        console.error("Error fetching extrahours:", extrahoursError);
        throw extrahoursError;
      }

      console.log("Overtime data fetched successfully, count:", extrahoursData.length);

      // Fetch breaks for extrahours
      const { data: remoteBreakData, error: remoteBreakError } = await supabase
        .from("Remote_Breaks")
        .select("start_time, end_time, Remote_Id")
        .in("Remote_Id", extrahoursData.map(a => a.id));

      if (remoteBreakError) {
        console.error("Error fetching remote breaks:", remoteBreakError);
      }

      // Group remote breaks by Remote_Id
      const remoteBreaksByAttendance = {};
      if (remoteBreakData) {
        remoteBreakData.forEach(b => {
          if (!remoteBreaksByAttendance[b.Remote_Id]) remoteBreaksByAttendance[b.Remote_Id] = [];
          remoteBreaksByAttendance[b.Remote_Id].push(b);
        });
      }

      // Calculate total overtime hours
      let totalOvertimeHours = 0;

      extrahoursData.forEach(log => {
        if (log.check_in && log.check_out) {
          const checkIn = new Date(log.check_in);
          const checkOut = new Date(log.check_out);

          let hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

          // Subtract remote breaks
          const remoteBreaks = remoteBreaksByAttendance[log.id] || [];
          let remoteBreakHours = 0;

          remoteBreaks.forEach(b => {
            if (b.start_time && b.end_time) {
              const breakStart = new Date(b.start_time);
              const breakEnd = new Date(b.end_time);
              remoteBreakHours += (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
            }
          });

          totalOvertimeHours += Math.max(0, hoursWorked - remoteBreakHours);
        }
      });

      // Get profile image URL
      let profileImageUrl = defaultUserProfile;
      if (userData.profile_image) {
        profileImageUrl = userData.profile_image.startsWith("http")
          ? userData.profile_image
          : supabase.storage.from("profilepics").getPublicUrl(userData.profile_image).data.publicUrl;
      }

      // Calculate overtime pay
      const overtimePay = userData.per_hour_pay
        ? (parseFloat(userData.per_hour_pay) * totalOvertimeHours).toFixed(2)
        : "0";

      // Calculate total earnings
      const basicPay = parseFloat(userData.salary || 0);
      const overtimePayValue = parseFloat(overtimePay);
      const totalEarnings = basicPay + overtimePayValue;

      // Set employee data
      setEmployeeData({
        ...userData,
        profile_image_url: profileImageUrl,
        totalWorkingHours: totalNetWorkHours.toFixed(2),
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        overtimePay: overtimePay,
        totalEarnings: totalEarnings.toFixed(2)
      });

    } catch (err) {
      setError(err.message);
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="text-center p-4">
        No employee data found.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[28px] leading-9 text-[#000000] font-bold mb-4">Salary Breakdown</h2>

      <div className="bg-white shadow-lg rounded-[10px] p-6 flex flex-wrap items-center justify-between">
        <div className="flex space-x-4 space-y-4">
          <img
            src={employeeData.profile_image_url || defaultUserProfile}
            alt="Profile"
            className="w-40 h-40 rounded-[10px] object-cover"
          />
          <div>
            <h3 className="font-semibold text-[#000000] text-xl leading-[30.01px]">{employeeData.full_name}</h3>
            <p className="font-normal text-[#404142] text-base leading-[24.55px]">{employeeData.profession}</p>
          </div>
        </div>

        <div className="bg-purple-600 flex justify-center items-center gap-4 text-white p-8 rounded-lg text-lg leading-4 font-normal">
          Your Total Earning is <span className="font-bold text-[40px]">{employeeData.totalEarnings}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white shadow-lg rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div>
              <img src={earningImage} alt="earningImage" className='h-[23px] w-[23px]' />
            </div>
            <div className="font-semibold text-xl leading-[27px] text-[#000000]">
              Earnings
            </div>
          </div>
          <div className="border border-[#C0BFBF]"></div>
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Basic Pay</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{employeeData.salary || 0}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Hours</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{employeeData.totalWorkingHours}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Pay Per Hour</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{employeeData.per_hour_pay || 0}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Overtime</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{employeeData.overtimePay}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Earning</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{employeeData.totalEarnings}</span>
            </div>
          </div>
        </div>

        {/* Deductions - Keeping fixed values as per requirements */}
        <div className="bg-white shadow-lg rounded-lg p-4 h-min">
          <div className="flex items-center gap-2 mb-3">
            <div>
              <img src={deductImage} alt="deductionImage" className='h-[23px] w-[23px]' />
            </div>
            <div className="font-semibold text-xl leading-[27px] text-[#000000]">
              Deductions
            </div>
          </div>
          <div className="border border-[#C0BFBF]"></div>

          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Extra Leaves</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{extraLeaves}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Check-in Late</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{checkInLate}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Advance Pay</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{advancePay}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#6D6E70] font-normal text-base leading-5">Total Deduction</span>
              <span className="text-[#6D6E70] font-normal text-base leading-5">{totalDeduction}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
