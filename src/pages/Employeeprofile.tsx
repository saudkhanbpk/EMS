import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Phone, MapPin, CreditCard, Globe, Building2, Slack, Briefcase, X, ArrowLeft } from "lucide-react";
import { FaEdit } from "react-icons/fa";
import { startOfMonth } from "date-fns";
import {
  CheckCircle, PieChart, Users, CalendarClock, Moon, AlarmClockOff, Watch, Info, Landmark,
  Clock, DollarSign, FileMinusIcon, TrendingDown, TrendingUp, FileText
} from 'lucide-react';


const Employeeprofile = ({ employeeid, employee, employeeview, setemployeeview }) => {

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [incrementModel, setIncrementModel] = useState(false);
  const [lastIncrement, setLastIncrement] = useState(null); // Changed from increment to lastIncrement for clarity
  const [selectedmonth, setselectedmonth] = useState('');
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [monthlyData, setMonthlyData] = useState({
    totalAttendance: 0,
    totalAbsents: 0,
    totalLeaves: 0,
    totalWorkingHours: 0,
    totalOvertimeHours: 0,
    overtimePay: "0",
    activeTaskCount: 0,
    completedTaskCount: 0,
    completedTasksScore: 0,
    projectsCount: 0
  });

  // Function to fetch data for the selected month
  const fetchMonthlyData = async (startDate, endDate) => {
    try {
      setLoading(true);
      console.log("Fetching data for period:", startDate, "to", endDate);

      // Fetch attendance data for the selected month
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("id, check_in, check_out")
        .eq("user_id", employeeid)
        .gte("check_in", startDate)
        .lte("check_in", endDate);

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
        throw attendanceError;
      }

      // Fetch breaks for the attendance logs
      const { data: breakData, error: breakError } = await supabase
        .from("breaks")
        .select("start_time, end_time, attendance_id")
        .in("attendance_id", attendanceData.length > 0 ? attendanceData.map(a => a.id) : ['']);

      if (breakError) {
        console.error("Error fetching breaks:", breakError);
      }

      // Group breaks by attendance_id
      const breaksByAttendance = {};
      if (breakData) {
        breakData.forEach(b => {
          if (!breaksByAttendance[b.attendance_id]) breaksByAttendance[b.attendance_id] = [];
          breaksByAttendance[b.attendance_id].push(b);
        });
      }

      // Calculate total working hours
      let totalWorkHours = 0;
      attendanceData.forEach(log => {
        const checkIn = new Date(log.check_in);
        const checkOut = log.check_out ? new Date(log.check_out) : new Date(checkIn.getTime());

        let hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

        // Subtract breaks
        const breaks = breaksByAttendance[log.id] || [];
        let breakHours = 0;

        breaks.forEach(b => {
          if (b.start_time && b.end_time) {
            const breakStart = new Date(b.start_time);
            const breakEnd = new Date(b.end_time);
            breakHours += (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
          }
        });

        totalWorkHours += Math.max(0, hoursWorked - breakHours);
      });

      // Fetch overtime data for the selected month
      const { data: extrahoursData, error: extrahoursError } = await supabase
        .from("extrahours")
        .select("id, check_in, check_out")
        .eq("user_id", employeeid)
        .gte("check_in", startDate)
        .lte("check_in", endDate);

      if (extrahoursError) {
        console.error("Error fetching extrahours:", extrahoursError);
        throw extrahoursError;
      }

      // Fetch breaks for extrahours
      const { data: remoteBreakData, error: remoteBreakError } = await supabase
        .from("Remote_Breaks")
        .select("start_time, end_time, Remote_Id")
        .in("Remote_Id", extrahoursData.length > 0 ? extrahoursData.map(a => a.id) : ['']);

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

      // Fetch absences and leaves for the selected month
      const { data: absenteeData, error: absenteeError } = await supabase
        .from("absentees")
        .select("absentee_type, created_at")
        .eq("user_id", employeeid)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (absenteeError) {
        console.error("Error fetching absentees:", absenteeError);
        throw absenteeError;
      }

      const totalAbsents = absenteeData.filter(a => a.absentee_type === "Absent").length;
      const totalLeaves = absenteeData.filter(a => a.absentee_type === "leave").length;

      // Calculate overtime pay
      const overtimePay = employeeData?.per_hour_pay
        ? (parseFloat(employeeData.per_hour_pay) * totalOvertimeHours).toFixed(2)
        : "0";

      // Fetch all tasks for the selected month
      const { data: allTasksData, error: tasksError } = await supabase
        .from("tasks_of_projects")
        .select("*")
        .gte("action_date", startDate)
        .lte("action_date", endDate);

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
      }

      // Filter tasks where the employee is in the devops array or is the user_id
      const tasksData = allTasksData ? allTasksData.filter(task => {
        // Check if task is directly assigned to the employee
        if (task.user_id === employeeid) return true;

        // Check if employee is in the devops array
        if (task.devops && Array.isArray(task.devops)) {
          return task.devops.some(dev => dev && typeof dev === 'object' && dev.id === employeeid);
        }

        return false;
      }) : [];

      console.log("Monthly tasks found:", tasksData.length);

      // Count active tasks
      const activeTaskCount = tasksData.filter(task => task.status !== "done").length;

      // Get completed tasks and calculate total score
      const completedTasks = tasksData.filter(task => task.status === "done");
      const completedTaskCount = completedTasks.length;
      const completedTasksScore = completedTasks.reduce((sum, task) => sum + (Number(task.score) || 0), 0);

      // Fetch all projects for the selected month
      const { data: allProjectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
      }

      // Filter projects where the employee is in the devops array
      const projectsData = allProjectsData ? allProjectsData.filter(project => {
        if (!project.devops || !Array.isArray(project.devops)) return false;

        // Check if any devops entry has the employee's ID
        return project.devops.some(dev => dev && typeof dev === 'object' && dev.id === employeeid);
      }) : [];

      console.log("Monthly projects found:", projectsData.length);
      const projectsCount = projectsData.length;

      // Update the monthly data state
      setMonthlyData({
        totalAttendance: attendanceData.length,
        totalAbsents,
        totalLeaves,
        totalWorkingHours: totalWorkHours.toFixed(2),
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        overtimePay,
        activeTaskCount,
        completedTaskCount,
        completedTasksScore,
        projectsCount
      });

      console.log("Monthly data updated:", {
        totalAttendance: attendanceData.length,
        totalAbsents,
        totalLeaves,
        totalWorkingHours: totalWorkHours.toFixed(2),
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        overtimePay,
        activeTaskCount,
        completedTaskCount,
        completedTasksScore,
        projectsCount
      });

    } catch (err) {
      console.error("Error fetching monthly data:", err);
      setError("Failed to fetch monthly data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handle month selection
  useEffect(() => {
    if (selectedmonth) {
      try {
        // Calculate start and end dates for the selected month
        const startOfMonthDate = startOfMonth(new Date(selectedmonth));
        const endOfMonthDate = new Date(startOfMonthDate.getFullYear(), startOfMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        console.log("Selected month:", selectedmonth);
        console.log("Start of Month:", startOfMonthDate.toISOString());
        console.log("End of Month:", endOfMonthDate.toISOString());

        // Set the start and end dates
        setStartdate(startOfMonthDate.toISOString());
        setEnddate(endOfMonthDate.toISOString());

        // Fetch data for the selected month
        fetchMonthlyData(startOfMonthDate.toISOString(), endOfMonthDate.toISOString());
      } catch (err) {
        console.error("Error processing dates:", err);
      }
    }
  }, [selectedmonth, employeeid]);


  const [incrementData, setIncrementData] = useState({
    user_id: employeeid,
    increment_amount: "",
    increment_date: new Date().toISOString().split('T')[0], // Default to today's date
    basic_salary: "",
    after_increment: ""
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    personal_email: "",
    slack_id: "",
    location: "",
    profession: "",
    salary: "",
    per_hour_pay: "",
    role: "",
    profile_image: null,
  });

  const getEmploymentDuration = (joinDate) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joined);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profile_image: file }));
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", employeeid)
        .single();

      if (userError) throw userError;

      const { data: increments, error: incrementError } = await supabase
        .from("sallery_increment")
        .select("increment_date, increment_amount")
        .eq("user_id", employeeid)
        .order("increment_date", { ascending: false })
        .limit(1);

      if (incrementError) console.error("Error fetching increments:", incrementError);
      if (increments?.length) setLastIncrement(increments[0]);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, devops");

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks_of_projects")
        .select("*");

      if (tasksError) throw tasksError;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_logs")
        .select("id, check_in, check_out")
        .eq("user_id", employeeid);

      if (attendanceError) throw attendanceError;

      const { data: breakData, error: breakError } = await supabase
        .from("breaks")
        .select("start_time, end_time, attendance_id")
        .in("attendance_id", attendanceData.map(a => a.id));

      if (breakError) throw breakError;

      // Group breaks by attendance_id
      const breaksByAttendance: Record<string, { start_time: string; end_time: string | null }[]> = {};
      breakData.forEach(b => {
        if (!breaksByAttendance[b.attendance_id]) breaksByAttendance[b.attendance_id] = [];
        breaksByAttendance[b.attendance_id].push(b);
      });

      let totalWorkHours = 0;

      attendanceData.forEach(log => {
        const checkIn = new Date(log.check_in);
        const checkOut = log.check_out ? new Date(log.check_out) : new Date(checkIn.getTime()); // fallback to check_in time

        let hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);

        // Subtract breaks
        const breaks = breaksByAttendance[log.id] || [];
        let breakHours = 0;

        breaks.forEach(b => {
          const breakStart = new Date(b.start_time);
          const breakEnd = b.end_time ? new Date(b.end_time) : new Date(breakStart.getTime() + 60 * 60 * 1000);
          breakHours += (breakEnd - breakStart) / (1000 * 60 * 60);
        });

        totalWorkHours += Math.max(0, hoursWorked - breakHours);
      });

      const totalAttendance = attendanceData.length;

      // Fetch overtime hours from extrahours table
      const { data: extrahoursData, error: extrahoursError } = await supabase
        .from("extrahours")
        .select("id, check_in, check_out")
        .eq("user_id", employeeid);

      if (extrahoursError) {
        console.error("Error fetching extrahours:", extrahoursError);
        throw extrahoursError;
      }

      // Fetch breaks for extrahours
      const { data: remoteBreakData, error: remoteBreakError } = await supabase
        .from("Remote_Breaks")
        .select("start_time, end_time, Remote_Id")
        .in("Remote_Id", extrahoursData.map(a => a.id));

      if (remoteBreakError) {
        console.error("Error fetching remote breaks:", remoteBreakError);
      }

      // Group remote breaks by Remote_Id
      const remoteBreaksByAttendance: Record<string, { start_time: string; end_time: string | null }[]> = {};
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

      console.log("Total overtime hours:", totalOvertimeHours);

      const { data: absenteeData, error: absenteeError } = await supabase
        .from("absentees")
        .select("absentee_type")
        .eq("user_id", employeeid);

      if (absenteeError) throw absenteeError;

      const totalAbsents = absenteeData.filter(a => a.absentee_type === "Absent").length;
      const totalLeaves = absenteeData.filter(a => a.absentee_type === "leave").length;

      // Filter projects where the employee is in the devops array
      const employeeProjects = projectsData.filter(project => {
        if (!project.devops || !Array.isArray(project.devops)) return false;
        return project.devops.some(dev => dev && typeof dev === 'object' && dev.id === userData.id);
      });

      console.log("All-time projects found:", employeeProjects.length);

      // Filter active tasks where the employee is in the devops array or is the user_id
      const employeeTasks = tasksData.filter(task => {
        // Check if task is directly assigned to the employee
        if (task.user_id === userData.id) return true;

        // Check if employee is in the devops array and task is not done
        if (task.devops && Array.isArray(task.devops)) {
          return task.devops.some(dev => dev && typeof dev === 'object' && dev.id === userData.id) &&
            task.status?.toLowerCase() == "done";
        }

        return false;
      });

      // Filter completed tasks where the employee is in the devops array or is the user_id
      const completedTasks = tasksData.filter(task => {
        // Check if task is directly assigned to the employee and is done
        if (task.user_id === userData.id && task.status?.toLowerCase() === "done") return true;

        // Check if employee is in the devops array and task is done
        if (task.devops && Array.isArray(task.devops)) {
          return task.devops.some(dev => dev && typeof dev === 'object' && dev.id === userData.id) &&
            task.status?.toLowerCase() === "done";
        }

        return false;
      });

      console.log("All-time active tasks found:", employeeTasks.length);
      console.log("All-time completed tasks found:", completedTasks.length);

      const totalKPI = employeeTasks.reduce((sum, task) => sum + (Number(task.score) || 0), 0);

      let profileImageUrl = null;
      if (userData.profile_image) {
        profileImageUrl = userData.profile_image.startsWith("http")
          ? userData.profile_image
          : supabase.storage.from("profilepics").getPublicUrl(userData.profile_image).data.publicUrl;
      }

      // Calculate overtime pay
      const overtimePay = userData.per_hour_pay ? (parseFloat(userData.per_hour_pay) * totalOvertimeHours).toFixed(2) : "0";

      const enrichedEmployee = {
        ...userData,
        profile_image_url: profileImageUrl,
        projects: employeeProjects.map(p => p.title),
        projectid: employeeProjects.map(p => p.id),
        TotalKPI: totalKPI,
        activeTaskCount: employeeTasks.length,
        completedTaskCount: completedTasks.length,
        totalWorkingHours: totalWorkHours.toFixed(2),
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        overtimePay: overtimePay,
        totalAttendance,
        totalAbsents,
        totalLeaves
      };

      setEmployeeData(enrichedEmployee);

      setFormData({
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
        personal_email: userData.personal_email,
        slack_id: userData.slack_id,
        location: userData.location,
        profession: userData.profession,
        salary: userData.salary,
        per_hour_pay: userData.per_hour_pay,
        role: userData.role || "",
        profile_image: null,
      });

    } catch (err) {
      setError(err.message);
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // const fetchEmployee2 = async () => {
  //   try {
  //     setLoading(true);

  //     const { data: userData, error: userError } = await supabase
  //       .from("users")
  //       .select("*")
  //       .eq("id", employeeid)
  //       .single();

  //     if (userError) throw userError;

  //     const { data: increments, error: incrementError } = await supabase
  //       .from("sallery_increment")
  //       .select("increment_date, increment_amount")
  //       .eq("user_id", employeeid)
  //       .order("increment_date", { ascending: false })
  //       .limit(1);

  //     if (incrementError) console.error("Error fetching increments:", incrementError);
  //     if (increments?.length) setLastIncrement(increments[0]);

  //     const { data: projectsData, error: projectsError } = await supabase
  //       .from("projects")
  //       .select("id, title, devops");

  //     if (projectsError) throw projectsError;

  //     const { data: tasksData, error: tasksError } = await supabase
  //       .from("tasks_of_projects")
  //       .select("*");

  //     if (tasksError) throw tasksError;

  //     const { data: attendanceData, error: attendanceError } = await supabase
  //       .from("attendance_logs")
  //       .select("id, check_in, check_out")
  //       .eq("user_id", employeeid);

  //     if (attendanceError) throw attendanceError;

  //     const { data: breakData, error: breakError } = await supabase
  //       .from("breaks")
  //       .select("start_time, end_time, attendance_id")
  //       .in("attendance_id", attendanceData.map(a => a.id));

  //     if (breakError) throw breakError;

  //     // Group breaks by attendance_id
  //     const breaksByAttendance: Record<string, { start_time: string; end_time: string | null }[]> = {};
  //     breakData.forEach(b => {
  //       if (!breaksByAttendance[b.attendance_id]) breaksByAttendance[b.attendance_id] = [];
  //       breaksByAttendance[b.attendance_id].push(b);
  //     });

  //     let totalWorkHours = 0;

  //     attendanceData.forEach(log => {
  //       const checkIn = new Date(log.check_in);
  //       const checkOut = log.check_out ? new Date(log.check_out) : new Date(checkIn.getTime()); // fallback to check_in time

  //       let hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);

  //       // Subtract breaks
  //       const breaks = breaksByAttendance[log.id] || [];
  //       let breakHours = 0;

  //       breaks.forEach(b => {
  //         const breakStart = new Date(b.start_time);
  //         const breakEnd = b.end_time ? new Date(b.end_time) : new Date(breakStart.getTime() + 60 * 60 * 1000);
  //         breakHours += (breakEnd - breakStart) / (1000 * 60 * 60);
  //       });

  //       totalWorkHours += Math.max(0, hoursWorked - breakHours);
  //     });

  //     const totalAttendance = attendanceData.length;

  //     // Fetch overtime hours from extrahours table
  //     const { data: extrahoursData, error: extrahoursError } = await supabase
  //       .from("extrahours")
  //       .select("id, check_in, check_out")
  //       .eq("user_id", employeeid);

  //     if (extrahoursError) {
  //       console.error("Error fetching extrahours:", extrahoursError);
  //       throw extrahoursError;
  //     }

  //     // Fetch breaks for extrahours
  //     const { data: remoteBreakData, error: remoteBreakError } = await supabase
  //       .from("Remote_Breaks")
  //       .select("start_time, end_time, Remote_Id")
  //       .in("Remote_Id", extrahoursData.map(a => a.id));

  //     if (remoteBreakError) {
  //       console.error("Error fetching remote breaks:", remoteBreakError);
  //     }

  //     // Group remote breaks by Remote_Id
  //     const remoteBreaksByAttendance: Record<string, { start_time: string; end_time: string | null }[]> = {};
  //     if (remoteBreakData) {
  //       remoteBreakData.forEach(b => {
  //         if (!remoteBreaksByAttendance[b.Remote_Id]) remoteBreaksByAttendance[b.Remote_Id] = [];
  //         remoteBreaksByAttendance[b.Remote_Id].push(b);
  //       });
  //     }

  //     // Calculate total overtime hours
  //     let totalOvertimeHours = 0;

  //     extrahoursData.forEach(log => {
  //       if (log.check_in && log.check_out) {
  //         const checkIn = new Date(log.check_in);
  //         const checkOut = new Date(log.check_out);

  //         let hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

  //         // Subtract remote breaks
  //         const remoteBreaks = remoteBreaksByAttendance[log.id] || [];
  //         let remoteBreakHours = 0;

  //         remoteBreaks.forEach(b => {
  //           if (b.start_time && b.end_time) {
  //             const breakStart = new Date(b.start_time);
  //             const breakEnd = new Date(b.end_time);
  //             remoteBreakHours += (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
  //           }
  //         });

  //         totalOvertimeHours += Math.max(0, hoursWorked - remoteBreakHours);
  //       }
  //     });

  //     console.log("Total overtime hours:", totalOvertimeHours);

  //     const { data: absenteeData, error: absenteeError } = await supabase
  //       .from("absentees")
  //       .select("absentee_type")
  //       .eq("user_id", employeeid);

  //     if (absenteeError) throw absenteeError;

  //     const totalAbsents = absenteeData.filter(a => a.absentee_type === "Absent").length;
  //     const totalLeaves = absenteeData.filter(a => a.absentee_type === "leave").length;

  //     const employeeProjects = projectsData.filter(project =>
  //       project.devops?.some((dev: any) => dev.id === userData.id)
  //     );

  //     const employeeTasks = tasksData.filter(task =>
  //       task.devops?.some((dev: any) => dev.id === userData.id) &&
  //       task.status?.toLowerCase() !== "done"
  //     );

  //     const totalKPI = employeeTasks.reduce((sum, task) => sum + (Number(task.score) || 0), 0);

  //     let profileImageUrl = null;
  //     if (userData.profile_image) {
  //       profileImageUrl = userData.profile_image.startsWith("http")
  //         ? userData.profile_image
  //         : supabase.storage.from("profilepics").getPublicUrl(userData.profile_image).data.publicUrl;
  //     }

  //     // Calculate overtime pay
  //     const overtimePay = userData.per_hour_pay ? (parseFloat(userData.per_hour_pay) * totalOvertimeHours).toFixed(2) : "0";

  //     const enrichedEmployee = {
  //       ...userData,
  //       profile_image_url: profileImageUrl,
  //       projects: employeeProjects.map(p => p.title),
  //       projectid: employeeProjects.map(p => p.id),
  //       TotalKPI: totalKPI,
  //       activeTaskCount: employeeTasks.length,
  //       totalWorkingHours: totalWorkHours.toFixed(2),
  //       totalOvertimeHours: totalOvertimeHours.toFixed(2),
  //       overtimePay: overtimePay,
  //       totalAttendance,
  //       totalAbsents,
  //       totalLeaves
  //     };

  //     setEmployeeData(enrichedEmployee);

  //     setFormData({
  //       full_name: userData.full_name,
  //       email: userData.email,
  //       phone_number: userData.phone_number,
  //       personal_email: userData.personal_email,
  //       slack_id: userData.slack_id,
  //       location: userData.location,
  //       profession: userData.profession,
  //       salary: userData.salary,
  //       per_hour_pay: userData.per_hour_pay,
  //       role: userData.role || "",
  //       profile_image: null,
  //     });

  //   } catch (err) {
  //     setError(err.message);
  //     console.error("Error:", err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };




  useEffect(() => {
    if (employeeid) fetchEmployee();
  }, [employeeid]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleIncrementChange = (e) => {
    setIncrementData({
      ...incrementData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitIncrement = async (e) => {
    e.preventDefault();
    try {
      if (!employeeData) {
        setError("Employee data not available");
        return;
      }

      // Calculate the new salary
      const currentSalary = Number(employeeData.salary);
      const incrementAmount = Number(incrementData.increment_amount);
      const newSalary = currentSalary + incrementAmount;

      // Update the increment data with the current and new salary
      const updatedIncrementData = {
        ...incrementData,
        basic_salary: currentSalary.toString(),
        after_increment: newSalary.toString()
      };

      // Insert the increment record
      const { error } = await supabase
        .from("sallery_increment")
        .insert([updatedIncrementData]);

      if (error) throw error;

      // Update the employee's salary in the users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ salary: newSalary })
        .eq("id", employeeid);

      if (updateError) throw updateError;

      // Update the lastIncrement state directly
      setLastIncrement({
        increment_amount: incrementData.increment_amount,
        increment_date: incrementData.increment_date,
        basic_salary: currentSalary.toString(),
        after_increment: newSalary.toString()
      });

      // Refresh the data
      await fetchEmployee();
      setIncrementModel(false);
      setIncrementData({
        user_id: employeeid,
        increment_amount: "",
        increment_date: new Date().toISOString().split('T')[0],
        basic_salary: "",
        after_increment: ""
      });
    } catch (err) {
      if (err instanceof Error) {
        setError("Failed to save increment: " + err.message);
      } else {
        setError("Failed to save increment: Unknown error");
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      let profileImagePath = employeeData.profile_image;

      if (formData.profile_image) {
        const fileExt = formData.profile_image.name.split(".").pop();
        const fileName = `${employeeid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profilepics")
          .upload(filePath, formData.profile_image, { upsert: true });

        if (uploadError) throw uploadError;
        profileImagePath = filePath;
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          personal_email: formData.personal_email,
          slack_id: formData.slack_id,
          location: formData.location,
          profession: formData.profession,
          salary: formData.salary,
          per_hour_pay: formData.per_hour_pay,
          role: formData.role,
          profile_image: profileImagePath,
        })
        .eq("id", employeeid)
        .select();

      if (error) throw error;

      setEmployeeData(data[0]);
      setIsEditMode(false);

      fetchEmployee();
    } catch (err) {
      setError("Failed to save changes: " + err.message);
    }
  };

  console.log("Employee : ", employee);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  if (loading) return <div className="text-center p-4">Loading profile...</div>;
  if (!employeeData) return <div className="p-4">No employee found</div>;

  return (
    <div className="w-full flex flex-col justify-center  items-center min-h-screen  bg-gray-50 p-6">
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center rounded-lg justify-between gap-4 p-3 bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setemployeeview('generalview')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
      </div>
      <input
        type="month"
        value={selectedmonth}
        onChange={(e) => setselectedmonth(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-gray-50"
      />
    </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <button
            onClick={() => setIncrementModel(true)}
            className="flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition duration-200 w-full sm:w-auto"
          >
            Add Increment
          </button>

          <button
            onClick={handleEditClick}
            className="flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition duration-200 w-full sm:w-auto"
          >
            <FaEdit className="mr-2" />
            Edit
          </button>
        </div>

      </div>

      <div className="bg-white flex flex-col md:flex-row justify-between items-center rounded-2xl shadow-md p-4 md:p-6 max-w-4xl mb-5 w-full gap-6">
        {/* Left Section: Profile */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
          <img
            src={
              formData.profile_image
                ? URL.createObjectURL(formData.profile_image)
                : employeeData?.profile_image_url || "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover"
          />
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h2 className="text-lg sm:text-xl text-gray-700 font-semibold">
              {employeeData?.full_name || "Employee"}
            </h2>
            <p className="text-gray-600 capitalize">{employeeData?.role || "employee"}</p>
          </div>
        </div>

        {/* Right Section: Earnings */}
        <div className="bg-purple-600 w-full md:w-auto h-fit flex flex-col justify-center items-center text-white px-6 py-4 rounded-lg text-base sm:text-lg font-medium">
          <span className="mr-2">Total Earning is</span>
          <span className="font-bold text-3xl sm:text-4xl ml-2">
            {employeeData?.salary ?
              selectedmonth ?
                (parseFloat(employeeData.salary) + parseFloat(monthlyData.overtimePay || "0")).toFixed(2)
                : (parseFloat(employeeData.salary) + parseFloat(employeeData.overtimePay || "0")).toFixed(2)
              : "0"}
          </span>
          {selectedmonth && <span className="text-xs mt-1"></span>}
        </div>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-6 max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-md pb-4 flex flex-col items-center justify-center text-center">
          <p className="text-[140px] text-gray-500">
            {selectedmonth
              ? monthlyData.projectsCount
              : (employeeData && employeeData.projects ? employeeData.projects.length : " ")}
          </p>
          <p className="text-xl font-semibold">
            {selectedmonth ? "Monthly Projects" : "Total Projects"}
          </p>
          {selectedmonth && <p className="text-xs text-gray-400">For selected month</p>}
          <button className="bg-purple-600 rounded-2xl px-3 py-1 mt-2 text-sm text-white">View Details</button>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.completedTasksScore : (employeeData?.TotalKPI || 0)}
              </h2>
              <CheckCircle className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Completed Story Points</div>
            {selectedmonth && (
              <div className="text-gray-400 text-xs mt-1">
                {monthlyData.completedTaskCount > 0
                  ? `${monthlyData.completedTaskCount} ${monthlyData.completedTaskCount === 1 ? 'task' : 'tasks'} completed this month`
                  : "0 task completed this month"
                }
              </div>
            )}
          </div>


          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center mt-3">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.totalAttendance : (employeeData?.totalAttendance || 0)}
              </h2>
              <Moon className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Present Days</div>
            {selectedmonth && <div className="text-gray-400 text-xs mt-1">For selected month</div>}
          </div>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.totalWorkingHours : (employeeData?.totalWorkingHours || 0)}
              </h2>
              <Clock className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Total Working Hours</div>
            {selectedmonth ?
              <div className="text-gray-400 text-xs mt-1">For selected month</div> :
              <div className="text-gray-400 text-xs mt-1">All time total</div>
            }
          </div>

          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.totalAbsents : (employeeData?.totalAbsents || 0)}
              </h2>
              <AlarmClockOff className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Absent Days</div>
            {selectedmonth && <div className="text-gray-400 text-xs mt-1">For selected month</div>}
          </div>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.totalOvertimeHours : (employeeData?.totalOvertimeHours || 0)}
              </h2>
              <Watch className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Overtime Hours</div>
            {selectedmonth ?
              <div className="text-gray-400 text-xs mt-1">For selected month</div> :
              <div className="text-gray-400 text-xs mt-1">Calculated from extrahours records</div>
            }
          </div>

          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">
                {selectedmonth ? monthlyData.totalLeaves : (employeeData?.totalLeaves || 0)}
              </h2>
              <CalendarClock className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Leave Days</div>
            {selectedmonth && <div className="text-gray-400 text-xs mt-1">For selected month</div>}
          </div>
        </div>

      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-gray-50">
        {/* Personal Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 w-72">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
              <Info className="text-purple-600 h-4 w-4" />
            </div>
            <h2 className="text-gray-800 font-medium">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Email</span>
              <span className="text-gray-600 text-sm">{employeeData?.email || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Phone Number</span>
              <span className="text-gray-600 text-sm">{employeeData?.phone_number || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Slack id</span>
              <span className="text-gray-600 text-sm">{employeeData?.slack_id || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">CNIC Number</span>
              <span className="text-gray-600 text-sm">{employeeData?.CNIC || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Bank Account No</span>
              <span className="text-gray-600 text-sm">{employeeData?.bank_account || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Employement Duration</span>
              <span className="text-gray-600 text-sm">{employeeData?.created_at ? getEmploymentDuration(employeeData.created_at) : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Earnings Card */}
        <div className="bg-white rounded-lg shadow-md p-6 w-72">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
              <DollarSign className="text-purple-600 h-4 w-4" />
            </div>
            <h2 className="text-gray-800 font-medium">Earnings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Basic Pay</span>
              <span className="text-gray-600 text-sm">{employeeData?.salary || "0"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Hours</span>
              <span className="text-gray-600 text-sm">{selectedmonth ? monthlyData.totalWorkingHours : (employeeData?.totalWorkingHours || 0)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Pay Per Hour</span>
              <span className="text-gray-600 text-sm">{employeeData?.per_hour_pay || "0"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Overtime</span>
              <span className="text-gray-600 text-sm">
                {selectedmonth ? monthlyData.overtimePay : (employeeData?.overtimePay || "0")}
                {selectedmonth && <span className="text-xs text-gray-400 ml-1">(monthly)</span>}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Earning</span>
              <span className="text-gray-600 text-sm">
                {employeeData?.salary ?
                  selectedmonth ?
                    (parseFloat(employeeData.salary) + parseFloat(monthlyData.overtimePay || "0")).toFixed(2) +
                    (selectedmonth ? "" : "")
                    : (parseFloat(employeeData.salary) + parseFloat(employeeData.overtimePay || "0")).toFixed(2)
                  : "0"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Last Increment</span>
              <span className="text-gray-600 text-sm">
                {lastIncrement
                  ? `Rs. ${lastIncrement.increment_amount} on ${new Date(lastIncrement.increment_date).toLocaleDateString()}`
                  : "N/A"}
              </span>
            </div>

            {lastIncrement && lastIncrement.basic_salary && lastIncrement.after_increment && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Increment Details</span>
                <span className="text-gray-600 text-sm">
                  {`Rs. ${lastIncrement.basic_salary} → Rs. ${lastIncrement.after_increment}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Deductions Card */}
        <div className="bg-white rounded-lg shadow-md p-6 w-72">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
              <FileMinusIcon className="text-purple-600 h-4 w-4" />
            </div>
            <h2 className="text-gray-800 font-medium">Deductions</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Extra Leaves</span>
              <span className="text-gray-600 text-sm">5000</span>
            </div>

            {/* <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Check-in Late</span>
              <span className="text-gray-600 text-sm">1200</span>
            </div> */}

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Advance Pay</span>
              <span className="text-gray-600 text-sm">1500</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Deduction</span>
              <span className="text-gray-600 text-sm">1500</span>
            </div>
          </div>
        </div>
      </div>





      {incrementModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-96">
            <div className="flex flex-row justify-between mb-4">
              <h2 className="text-lg font-bold">Add Increment</h2>
              <X
                size={30}
                onClick={() => setIncrementModel(false)}
                className="rounded-full hover:bg-gray-300 p-1 cursor-pointer"
              />
            </div>

            <form onSubmit={handleSubmitIncrement}>
              <div className="mb-4">
                <label htmlFor="increment_date" className="block mb-1 font-medium">
                  Increment Date:
                </label>
                <input
                  className="p-2 rounded-xl bg-gray-100 w-full"
                  type="date"
                  name="increment_date"
                  value={incrementData.increment_date}
                  onChange={handleIncrementChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="increment_amount" className="block mb-1 font-medium">
                  Increment Amount:
                </label>
                <input
                  className="p-2 rounded-xl bg-gray-100 w-full"
                  type="number"
                  name="increment_amount"
                  value={incrementData.increment_amount}
                  onChange={handleIncrementChange}
                  required
                />
              </div>

              <div className="text-center mt-6">
                <button
                  className="w-[50%] px-4 py-2 text-white rounded-xl bg-[#9A00FF] hover:bg-[#8a00e6]"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {isEditMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Edit Employee Profile</h2>
              <button
                onClick={() => setIsEditMode(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Profile Image Preview */}
              <div className="flex flex-col items-center mb-6">
                <img
                  src={
                    formData.profile_image
                      ? URL.createObjectURL(formData.profile_image)
                      : employeeData?.profile_image_url || "https://via.placeholder.com/150"
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-xl object-cover mb-4"
                />
                <div className="relative">
                  <input
                    type="file"
                    id="profile_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile_image"
                    className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                  >
                    Change Photo
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Personal Email</label>
                  <input
                    type="email"
                    name="personal_email"
                    value={formData.personal_email}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter personal email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Slack ID</label>
                  <input
                    type="text"
                    name="slack_id"
                    value={formData.slack_id}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter Slack ID"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter location"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Profession</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter profession"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Salary</label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter salary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Per Hour Pay</label>
                  <input
                    type="text"
                    name="per_hour_pay"
                    value={formData.per_hour_pay}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter hourly rate"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="project manager">Project Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 p-6 border-t">
              <button
                onClick={() => {
                  setIsEditMode(false)
                }}
                className="px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Employeeprofile;








