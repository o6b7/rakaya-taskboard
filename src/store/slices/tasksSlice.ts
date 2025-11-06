import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ColumnType, Priority } from "../../types";

interface TasksState {
  selectedTaskId: string | null;
  filterStatus: ColumnType | "all";
  filterPriority: Priority | "all";
  searchQuery: string;
  isTaskModalOpen: boolean;
}

const initialState: TasksState = {
  selectedTaskId: null,
  filterStatus: "all",
  filterPriority: "all",
  searchQuery: "",
  isTaskModalOpen: false,
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<TasksState["filterStatus"]>) => {
      state.filterStatus = action.payload;
    },
    setFilterPriority: (state, action: PayloadAction<TasksState["filterPriority"]>) => {
      state.filterPriority = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleTaskModal: (state, action?: PayloadAction<boolean | undefined>) => {
      state.isTaskModalOpen =
        typeof action?.payload === "boolean"
          ? action.payload
          : !state.isTaskModalOpen;
    },
  },
});

export const { 
  setSelectedTaskId, 
  setFilterStatus, 
  setFilterPriority,
  setSearchQuery, 
  toggleTaskModal 
} = tasksSlice.actions;
export default tasksSlice.reducer;
