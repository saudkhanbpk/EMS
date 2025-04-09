// import { create } from 'zustand';
// import { User } from '@supabase/supabase-js';

// interface AuthState {
//   user: User | null;
//   // isAuthenticated: boolean;
//   setUser: (user: User | null) => void;
//   restoreSession: () => void;
// }

// interface AttendanceState {
//   isCheckedIn: boolean;
//   checkInTime: string | null;
//   isOnBreak: boolean;
//   breakStartTime: string | null;
//   isRemoteCheckedIn: boolean;
//   RemotecheckInTime: string | null;
//   isOnRemoteBreak: boolean;
//   RemotebreakStartTime: string | null;
//   RemoteworkMode: 'on_site' | 'remote' | null;
//   workMode: 'on_site' | 'remote' | null;
//   setCheckIn: (time: string | null) => void;
//   setBreakTime: (time: string | null) => void;
//   setWorkMode: (mode: 'on_site' | 'remote' | null) => void;
//   setIsCheckedIn: (status: boolean) => void;
//   setIsOnBreak: (status: boolean) => void;
//   setRemoteCheckIn:  (time: string | null) => void;
//   setRemoteBreakTime: (time: string | null) => void;
//   setRemoteWorkMode: (mode: 'on_site' | 'remote' | null) => void;
//   setIsRemoteCheckedIn: (status: boolean) => void;
//   setIsOnRemoteBreak: (status: boolean) => void;
// }

// // ✅ Authentication Store
// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   isAuthenticated: false,

//   setUser: (user) => set({ user }),
//   initializeUser: () => {
//     const sessionData = localStorage.getItem('supabaseSession');
//     const session = sessionData ? JSON.parse(sessionData) : null;
//     if (session?.user) {
//       set({ user: session.user });
//     }
//   },
  


//   restoreSession: () => {
//     const session = localStorage.getItem('supabaseSession');
//     if (session) {
//       const parsedUser = JSON.parse(session);
//       if (parsedUser) {
//         set({ user: parsedUser});
//       }
//     }
//   },
// }));



// export const useAttendanceStore = create<AttendanceState>((set) => ({
//   isCheckedIn: false,
//   checkInTime: null,
//   isOnBreak: false,
//   breakStartTime: null,
//   workMode: null,
//   isRemoteCheckedIn: false,
//   RemotecheckInTime: null,
//   isOnRemoteBreak: false,
//   RemotebreakStartTime: null,
//   RemoteworkMode: null,

//   // Decouple state updates
//   setCheckIn: (time) => set({ checkInTime: time }),
//   setBreakTime: (time) => set({ breakStartTime: time }),
//   setWorkMode: (mode) => set({ workMode: mode }),
//   setIsCheckedIn: (status) => set({ isCheckedIn: status }),
//   setIsOnBreak: (status) => set({ isOnBreak: status }),
//   setRemoteCheckIn: (time) => set({ checkInTime: time }),
//   setRemoteBreakTime: (time) => set({ breakStartTime: time }),
//   setRemoteWorkMode: (mode) => set({ workMode: mode }),
//   setIsRemoteCheckedIn: (status) => set({ isCheckedIn: status }),
//   setIsOnRemoteBreak: (status) => set({ isOnBreak: status }),
// }));

import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

// ✅ Authentication Store
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

    isAuthenticated: false,
  
    initializeUser: () => {
      const sessionData = localStorage.getItem('supabaseSession');
      const session = sessionData ? JSON.parse(sessionData) : null;
      if (session?.user) {
        set({ user: session.user });
      }
    },
    

  restoreSession: () => {
    const sessionData = localStorage.getItem('supabaseSession');
    try {
      const parsedSession = sessionData ? JSON.parse(sessionData) : null;
      if (parsedSession?.user) {
        set({ user: parsedSession.user });
      }
    } catch (err) {
      console.error("Failed to parse session from localStorage", err);
    }
  },
}));




  

// ✅ Attendance Store
type WorkMode = 'on_site' | 'remote' | null;

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  isOnBreak: boolean;
  breakStartTime: string | null;
  isRemoteCheckedIn: boolean;
  RemotecheckInTime: string | null;
  isOnRemoteBreak: boolean;
  RemotebreakStartTime: string | null;
  RemoteworkMode: 'on_site' | 'remote' | null;
  workMode: 'on_site' | 'remote' | null;

  setCheckIn: (time: string | null) => void;
  setBreakTime: (time: string | null) => void;
  setWorkMode: (mode: 'on_site' | 'remote' | null) => void;
  setIsCheckedIn: (status: boolean) => void;
  setIsOnBreak: (status: boolean) => void;
  setRemoteCheckIn: (time: string | null) => void;
  setRemoteBreakTime: (time: string | null) => void;
  setRemoteWorkMode: (mode: 'on_site' | 'remote' | null) => void;
  setIsRemoteCheckedIn: (status: boolean) => void;
  setIsOnRemoteBreak: (status: boolean) => void;
}

// interface AttendanceState {
//   // On-site
//   isCheckedIn: boolean;
//   checkInTime: string | null;
//   isOnBreak: boolean;
//   breakStartTime: string | null;
//   workMode: WorkMode;

//   // Remote
//   isRemoteCheckedIn: boolean;
//   remoteCheckInTime: string | null;
//   isOnRemoteBreak: boolean;
//   remoteBreakStartTime: string | null;
//   remoteWorkMode: WorkMode;

//   // Setters
//   setIsCheckedIn: (status: boolean) => void;
//   setCheckInTime: (time: string | null) => void;
//   setIsOnBreak: (status: boolean) => void;
//   setBreakStartTime: (time: string | null) => void;
//   setWorkMode: (mode: WorkMode) => void;

//   setIsRemoteCheckedIn: (status: boolean) => void;
//   setRemoteCheckInTime: (time: string | null) => void;
//   setIsOnRemoteBreak: (status: boolean) => void;
//   setRemoteBreakStartTime: (time: string | null) => void;
//   setRemoteWorkMode: (mode: WorkMode) => void;
// }

// / ✅ Attendance Store
export const useAttendanceStore = create<AttendanceState>((set) => ({
  isCheckedIn: false,
  checkInTime: null,
  isOnBreak: false,
  breakStartTime: null,
  workMode: null,
  isRemoteCheckedIn: false,
  RemotecheckInTime: null,
  isOnRemoteBreak: false,
  RemotebreakStartTime: null,
  RemoteworkMode: null,

  setCheckIn: (time) => set({ checkInTime: time }),
  setBreakTime: (time) => set({ breakStartTime: time }),
  setWorkMode: (mode) => set({ workMode: mode }),
  setIsCheckedIn: (status) => set({ isCheckedIn: status }),
  setIsOnBreak: (status) => set({ isOnBreak: status }),

  // ✅ Corrected Remote State Updates
  setRemoteCheckIn: (time) => set({ RemotecheckInTime: time }),
  setRemoteBreakTime: (time) => set({ RemotebreakStartTime: time }),
  setRemoteWorkMode: (mode) => set({ RemoteworkMode: mode }),
  setIsRemoteCheckedIn: (status) => set({ isRemoteCheckedIn: status }),
  setIsOnRemoteBreak: (status) => set({ isOnRemoteBreak: status }),
}));

