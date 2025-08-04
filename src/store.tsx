import { configureStore } from '@reduxjs/toolkit';
import projectName from './slices/AdminProjectName';
import sideBar from './slices/SideBar';
import { AttendenceAPI } from './services/AttendanceAPI';
import absenteeCountReducer from './slices/userAbsenteesSlice'; // ← add this if you're storing absentee data

const globalStore = configureStore({
  reducer: {
    sideBar,
    projectName,
    absenteeCount: absenteeCountReducer, // ✅ mapped reducer
    [AttendenceAPI.reducerPath]: AttendenceAPI.reducer, // ✅ RTK Query reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(AttendenceAPI.middleware), // ✅ RTK Query middleware
});

export default globalStore;
export type RootState = ReturnType<typeof globalStore.getState>;
export type AppDispatch = typeof globalStore.dispatch;
