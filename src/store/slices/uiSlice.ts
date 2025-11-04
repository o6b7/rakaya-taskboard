import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UISliceState {
  sidebarOpen: boolean;
  darkMode: boolean;
  notificationOpen: boolean;
  toastMessage: string | null;
  toastType: "success" | "error" | "warning" | "info" | null;
}

const initialState: UISliceState = {
  sidebarOpen: true,
  darkMode: localStorage.getItem("darkMode") === "true",
  notificationOpen: false,
  toastMessage: null,
  toastType: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem("darkMode", state.darkMode.toString());
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem("darkMode", action.payload.toString());
    },
    toggleNotification: (state, action?: PayloadAction<boolean | undefined>) => {
      state.notificationOpen =
        typeof action?.payload === "boolean"
          ? action.payload
          : !state.notificationOpen;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: "success" | "error" | "warning" | "info" }>) => {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type;
    },
    clearToast: (state) => {
      state.toastMessage = null;
      state.toastType = null;
    },
  },
});

export const { 
  toggleSidebar, 
  toggleDarkMode, 
  setDarkMode,
  toggleNotification, 
  showToast,
  clearToast 
} = uiSlice.actions;
export default uiSlice.reducer;