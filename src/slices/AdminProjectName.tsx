import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminProjectNameState {
  projectName: string;
}

// Correct initial state with proper type
const initialState: AdminProjectNameState = {
  projectName: '',
};

const adminProjectNameSlice = createSlice({
  name: 'adminProjectName',
  initialState,
  reducers: {
    addProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
    },
  },
});

// Export actions and reducer
export const { addProjectName } = adminProjectNameSlice.actions;
export default adminProjectNameSlice.reducer;
