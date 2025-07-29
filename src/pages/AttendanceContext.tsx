import React, { createContext, useState } from 'react';

// Developer & Data Types
type Developer = {
  id: string;
  name: string;
};

type AttendanceData = any[]; // Replace with your specific type if available
type DateFormat = any;

// Initial context value (optional, can help with autocomplete if needed)
const initialContext = {
  attendanceDataWeekly: [] as AttendanceData,
  setAttendanceDataWeekly: (() => {}) as React.Dispatch<
    React.SetStateAction<AttendanceData>
  >,

  attendanceDataMonthly: [] as AttendanceData,
  setAttendanceDataMonthly: (() => {}) as React.Dispatch<
    React.SetStateAction<AttendanceData>
  >,

  AttendanceDataFiltered: [] as AttendanceData,
  setattendanceDataFiltered: (() => {}) as React.Dispatch<
    React.SetStateAction<AttendanceData>
  >,

  Devs: [] as Developer[],
  setDevs: (() => {}) as React.Dispatch<React.SetStateAction<Developer[]>>,

  selectedDateformate: undefined as DateFormat,
  setselectedDateformate: (() => {}) as React.Dispatch<
    React.SetStateAction<DateFormat>
  >,

  selectedTABB: '',
  setselectedTABB: (() => {}) as React.Dispatch<React.SetStateAction<string>>,

  projectIdd: '',
  setprojectIdd: (() => {}) as React.Dispatch<React.SetStateAction<string>>,

  devopsss: [] as Developer[],
  setdevopsss: (() => {}) as React.Dispatch<React.SetStateAction<Developer[]>>,

  openTaskBoard: (_projectId: string, _devs: Developer[]) => {},
  closeTaskBoard: () => {},
};

// ✅ This is the original export name — DO NOT CHANGE
export const AttendanceContext = createContext(initialContext);

// ✅ This is the original export name — DO NOT CHANGE
export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // States
  const [attendanceDataWeekly, setAttendanceDataWeekly] =
    useState<AttendanceData>([]);
  const [attendanceDataMonthly, setAttendanceDataMonthly] =
    useState<AttendanceData>([]);
  const [AttendanceDataFiltered, setattendanceDataFiltered] =
    useState<AttendanceData>([]);
  const [Devs, setDevs] = useState<Developer[]>([]);
  const [selectedDateformate, setselectedDateformate] = useState<DateFormat>();

  const [selectedTABB, setselectedTABB] = useState('projects');
  const [projectIdd, setprojectIdd] = useState('');
  const [devopsss, setdevopsss] = useState<Developer[]>([]);

  // Task Board Actions
  const openTaskBoard = (projectId: string, devs: Developer[]) => {
    setprojectIdd(projectId);
    setdevopsss(devs);
    setselectedTABB('tasks');
  };

  const closeTaskBoard = () => {
    setprojectIdd('');
    setdevopsss([]);
    setselectedTABB('projects');
  };
  console.log('project id from context', projectIdd);

  return (
    <AttendanceContext.Provider
      value={{
        attendanceDataWeekly,
        setAttendanceDataWeekly,
        attendanceDataMonthly,
        setAttendanceDataMonthly,
        AttendanceDataFiltered,
        setattendanceDataFiltered,
        Devs,
        setDevs,
        selectedDateformate,
        setselectedDateformate,
        selectedTABB,
        setselectedTABB,
        projectIdd,
        setprojectIdd,
        devopsss,
        setdevopsss,
        openTaskBoard,
        closeTaskBoard,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
