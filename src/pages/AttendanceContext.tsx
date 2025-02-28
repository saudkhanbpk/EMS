import React, { createContext, useState } from 'react';

// Create the context
export const AttendanceContext = createContext();

// Create a provider component
export const AttendanceProvider = ({ children }) => {
  const [attendanceDataWeekly, setAttendanceDataWeekly] = useState([]);
  const [attendanceDataMonthly, setAttendanceDataMonthly] = useState([]);

  return (
    <AttendanceContext.Provider value={{ attendanceDataWeekly, setAttendanceDataWeekly , 
    attendanceDataMonthly , setAttendanceDataMonthly} }>
      {children}
    </AttendanceContext.Provider>
  );
};