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

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  restoreSession: () => void;
}
// ✅ Authentication Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user }),
  initializeUser: () => {
    const sessionData = localStorage.getItem('supabaseSession');
    const session = sessionData ? JSON.parse(sessionData) : null;
    if (session?.user) {
      set({ user: session.user });
    }
  },
  


  restoreSession: () => {
    const session = localStorage.getItem('supabaseSession');
    if (session) {
      const parsedUser = JSON.parse(session);
      if (parsedUser) {
        set({ user: parsedUser});
      }
    }
  },
}));

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

// ✅ Attendance Store
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
