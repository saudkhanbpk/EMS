// absenteeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AbsenteeState {
  [userId: string]: number;
}

const initialState: AbsenteeState = {};

const absenteeSlice = createSlice({
  name: 'absentees',
  initialState,
  reducers: {
    setUserAbsentCount: (
      state,
      action: PayloadAction<{ userId: string; count: number }>
    ) => {
      const { userId, count } = action.payload;
      state[userId] = count;
    },
  },
});

export const { setUserAbsentCount } = absenteeSlice.actions;
export default absenteeSlice.reducer;
