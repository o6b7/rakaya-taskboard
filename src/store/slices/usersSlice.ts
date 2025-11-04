import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "../../types";

interface UsersState {
  selectedUser: UserProfile | null;
  searchQuery: string;
  roleFilter: string | "all";
}

const initialState: UsersState = {
  selectedUser: null,
  searchQuery: "",
  roleFilter: "all",
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.selectedUser = action.payload;
    },
    updateSelectedUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.selectedUser) {
        state.selectedUser = { ...state.selectedUser, ...action.payload };
      }
    },
    setUserSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<string | "all">) => {
      state.roleFilter = action.payload;
    },
  },
});

export const { 
  setSelectedUser, 
  updateSelectedUser,
  setUserSearchQuery, 
  setRoleFilter
} = usersSlice.actions;
export default usersSlice.reducer;