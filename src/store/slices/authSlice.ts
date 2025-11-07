import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile, AuthResponse } from "../../types";
import { jwtDecode } from "jwt-decode";

const loadAuthFromStorage = (): {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
} => {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("authUser");

  if (!token || !userStr) {
    return { token: null, user: null, isAuthenticated: false };
  }

  let user: UserProfile | null = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    console.warn("Failed to parse authUser from localStorage");
    return { token: null, user: null, isAuthenticated: false };
  }

  let isTokenValid = false;
  try {
    const decoded: any = jwtDecode(token);
    isTokenValid = decoded.exp * 1000 > Date.now();
  } catch (e) {
    console.warn("Invalid JWT token in localStorage");
  }

  if (!isTokenValid) {
    // CLEAR stale data
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    return { token: null, user: null, isAuthenticated: false };
  }

  return { token, user, isAuthenticated: true };
};

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  isAuthInitialized: boolean; 
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  isAuthInitialized: false,
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
      state.isAuthInitialized = true;

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
      state.isAuthInitialized = true; 

      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
    finishAuthInitialization: (state) => {
      state.isAuthInitialized = true;
    },
  },
});

export const {
  startLoading,
  stopLoading,
  setCredentials,
  updateUser,
  clearCredentials,
  finishAuthInitialization
} = authSlice.actions;

export default authSlice.reducer;