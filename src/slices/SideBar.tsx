import { createSlice } from '@reduxjs/toolkit';

interface SideBarState {
  isOpen: boolean;
}

const initialState: SideBarState = {
  isOpen: true,
};

const SideBarSlice = createSlice({
  name: 'SideBar',
  initialState: initialState,
  reducers: {
    openSideBar: (state) => {
      state.isOpen = true;
    },
    closeSideBar: (state) => {
      state.isOpen = false;
    },
  },
});

export default SideBarSlice.reducer;
export const { openSideBar, closeSideBar } = SideBarSlice.actions;
