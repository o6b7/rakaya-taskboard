import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Task, NewTask } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: ['Task'],
    }),
    getTasksByProject: builder.query<Task[], string>({
      query: (projectId) => `/tasks?projectId=${projectId}`,
      providesTags: ['Task'],
    }),
    getTaskById: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<Task, NewTask>({
      query: (newTask) => {
        const taskWithId: Task = {
          ...newTask,
          id: generateUniqueId('tasks'),
        };
        return {
          url: '/tasks',
          method: 'POST',
          body: taskWithId,
        };
      },
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
      query: ({ id, updates }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;