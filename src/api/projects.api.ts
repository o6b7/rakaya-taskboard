import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Project, NewProject } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
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
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProjectById: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<Project, NewProject>({
      query: (newProject) => {
        const projectWithId: Project = {
          ...newProject,
          id: generateUniqueId('projects'),
        };
        return {
          url: '/projects',
          method: 'POST',
          body: projectWithId,
        };
      },
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<Project, { id: string; updates: Partial<Project> }>({
      query: ({ id, updates }) => ({
        url: `/projects/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;