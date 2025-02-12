import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  // isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  restoreSession: () => void;
}

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  isOnBreak: boolean;
  breakStartTime: string | null;
  workMode: 'on_site' | 'remote' | null;
  setCheckIn: (time: string | null) => void;
  setBreakTime: (time: string | null) => void;
  setWorkMode: (mode: 'on_site' | 'remote' | null) => void;
  setIsCheckedIn: (status: boolean) => void;
  setIsOnBreak: (status: boolean) => void;
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



export const useAttendanceStore = create<AttendanceState>((set) => ({
  isCheckedIn: false,
  checkInTime: null,
  isOnBreak: false,
  breakStartTime: null,
  workMode: null,

  // Decouple state updates
  setCheckIn: (time) => set({ checkInTime: time }),
  setBreakTime: (time) => set({ breakStartTime: time }),
  setWorkMode: (mode) => set({ workMode: mode }),
  setIsCheckedIn: (status) => set({ isCheckedIn: status }),
  setIsOnBreak: (status) => set({ isOnBreak: status }),
}));
