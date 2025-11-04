// src/api/tasks.api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { Task, NewTask } from "../types";
import { authorizedBaseQuery } from "../lib/authorizedBaseQuery";

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

    updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
      query: ({ id, updates }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["Task"],
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
  useUpdateTaskMutation
} = tasksApi;