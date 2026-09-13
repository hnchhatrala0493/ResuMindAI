import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../app/api';
type AuthState = { accessToken: string | null; user: User | null };
const initialState: AuthState = { accessToken: null, user: null };
const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenReceived: (state, action: PayloadAction<{ accessToken: string; user: User }>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    loggedOut: (state) => {
      state.accessToken = null;
      state.user = null;
    },
  },
});
export const { tokenReceived, loggedOut } = slice.actions;
export default slice.reducer;
