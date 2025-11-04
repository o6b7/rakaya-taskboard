// src/api/tasks.api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { Task, NewTask } from "../types";
import { authorizedBaseQuery } from "../utils/authorizedBaseQuery";

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: authorizedBaseQuery,
  tagTypes: ["Task"],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => "/tasks",
      providesTags: ["Task"],
    }),

    getTasksByProject: builder.query<Task[], string>({
      query: (projectId) => `/tasks?projectId=${projectId}`,
      providesTags: ["Task"],
    }),

    createTask: builder.mutation<Task, NewTask>({
      query: (newTask) => ({
        url: "/tasks",
        method: "POST",
        body: newTask,
      }),
      invalidatesTags: ["Task"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTasksByProjectQuery,
  useCreateTaskMutation,
} = tasksApi;