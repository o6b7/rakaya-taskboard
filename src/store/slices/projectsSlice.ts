import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Project } from "../../types";

interface ProjectsState {
  activeProject: Project | null;
  isNewProjectModalOpen: boolean;
  searchQuery: string;
}

const initialState: ProjectsState = {
  activeProject: null,
  isNewProjectModalOpen: false,
  searchQuery: "",
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.activeProject = action.payload;
    },
    updateActiveProject: (state, action: PayloadAction<Partial<Project>>) => {
      if (state.activeProject) {
        state.activeProject = { ...state.activeProject, ...action.payload };
      }
    },
    toggleNewProjectModal: (state, action?: PayloadAction<boolean | undefined>) => {
      state.isNewProjectModalOpen =
        typeof action?.payload === "boolean"
          ? action.payload
          : !state.isNewProjectModalOpen;
    },
    setProjectSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { 
  setActiveProject, 
  updateActiveProject,
  toggleNewProjectModal, 
  setProjectSearchQuery 
} = projectsSlice.actions;
export default projectsSlice.reducer;