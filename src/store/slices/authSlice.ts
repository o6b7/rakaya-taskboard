import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile, AuthResponse } from "../../types";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem("authToken"),
  user: localStorage.getItem("authUser")
    ? JSON.parse(localStorage.getItem("authUser") as string)
    : null,
  isAuthenticated: !!localStorage.getItem("authToken"),
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startLoading: (state) => {
      state.loading = true;
    },
    stopLoading: (state) => {
      state.loading = false;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem("authToken", action.payload.token);
      localStorage.setItem("authUser", JSON.stringify(action.payload.user));
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("authUser", JSON.stringify(state.user));
      }
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
  },
});

export const {
  startLoading,
  stopLoading,
  setCredentials,
  updateUser,
  clearCredentials,
} = authSlice.actions;

export default authSlice.reducer;
