import { configureStore } from "@reduxjs/toolkit";

import { tasksApi } from "../api/tasks.api";
import { projectsApi } from "../api/projects.api";
import { usersApi } from "../api/users.api";
import { commentsApi } from "../api/comments.api";
import { authApi } from "../api/auth.api"; 

import tasksReducer from "../store/slices/tasksSlice";
import projectsReducer from "../store/slices/projectsSlice";
import usersReducer from "../store/slices/usersSlice";
import uiReducer from "../store/slices/uiSlice";
import authReducer from "../store/slices/authSlice";
import commentsReducer from "../store/slices/commentsSlice";

export const store = configureStore({
  reducer: {
    // RTK Query reducers
    [tasksApi.reducerPath]: tasksApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [authApi.reducerPath]: authApi.reducer, 

    // Local slices
    tasks: tasksReducer,
    projects: projectsReducer,
    users: usersReducer,
    ui: uiReducer,
    auth: authReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(tasksApi.middleware)
      .concat(projectsApi.middleware)
      .concat(usersApi.middleware)
      .concat(commentsApi.middleware)
      .concat(authApi.middleware), 
  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;