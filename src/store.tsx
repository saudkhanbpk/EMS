import { configureStore } from '@reduxjs/toolkit';

import sideBar from './slices/SideBar';

const globalStore = configureStore({
  reducer: {
    sideBar: sideBar,
  },
});

export default globalStore;
export type RootState = ReturnType<typeof globalStore.getState>;
export type AppDispatch = typeof globalStore.dispatch;
