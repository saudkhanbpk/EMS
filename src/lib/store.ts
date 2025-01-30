import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export const useAttendanceStore = create<AttendanceState>((set) => ({
  isCheckedIn: false,
  checkInTime: null,
  isOnBreak: false,
  breakStartTime: null,
  workMode: null,
  setCheckIn: (time) => set({ checkInTime: time }),
  setBreakTime: (time) => set({ breakStartTime: time }),
  setWorkMode: (mode) => set({ workMode: mode }),
  setIsCheckedIn: (status) => set({ isCheckedIn: status }),
  setIsOnBreak: (status) => set({ isOnBreak: status }),
}));