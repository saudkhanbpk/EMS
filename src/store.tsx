import { configureStore } from '@reduxjs/toolkit';
import projectName from './slices/AdminProjectName';
import sideBar from './slices/SideBar';

const globalStore = configureStore({
  reducer: {
    sideBar: sideBar,
    projectName: projectName,
  },
});

export default globalStore;
export type RootState = ReturnType<typeof globalStore.getState>;
export type AppDispatch = typeof globalStore.dispatch;
