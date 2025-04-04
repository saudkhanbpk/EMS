import React, { createContext, useState } from 'react';

// Create the context
export const AttendanceContext = createContext();
 
// Create a provider component
export const AttendanceProvider = ({ children }) => {
  const [attendanceDataWeekly, setAttendanceDataWeekly] = useState([]);
  const [attendanceDataMonthly, setAttendanceDataMonthly] = useState([]);
  const [AttendanceDataFiltered, setattendanceDataFiltered] = useState([]);

  return (
    <AttendanceContext.Provider value={{ attendanceDataWeekly, setAttendanceDataWeekly , 
    attendanceDataMonthly , setAttendanceDataMonthly , AttendanceDataFiltered , setattendanceDataFiltered} }>
      {children}
    </AttendanceContext.Provider>
  );
};