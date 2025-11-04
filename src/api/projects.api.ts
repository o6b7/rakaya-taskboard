// src/api/projects.api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { Project, NewProject } from "../types";
import { authorizedBaseQuery } from "../utils/authorizedBaseQuery";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: authorizedBaseQuery,
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => {
        console.log('🔍 [getProjects] Building query...');
        return "/projects";
      },
      providesTags: ["Project"],
    }),

    getProjectById: builder.query<Project, string>({
      query: (id) => {
        console.log('🔍 [getProjectById] Building query for ID:', id);
        return `/projects/${id}`;
      },
      providesTags: ["Project"],
    }),

    createProject: builder.mutation<Project, NewProject>({
      query: (newProject) => {
        console.log('🔍 [createProject] Building mutation with data:', newProject);
        return {
          url: "/projects",
          method: "POST",
          body: newProject,
        };
      },
      invalidatesTags: ["Project"],
    }),

    updateProject: builder.mutation<Project, { id: string; updates: Partial<Project> }>({
      query: ({ id, updates }) => {
        console.log('🔍 [updateProject] Building mutation for ID:', id);
        return {
          url: `/projects/${id}`,
          method: "PATCH",
          body: updates,
        };
      },
      invalidatesTags: ["Project"],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => {
        console.log('🔍 [deleteProject] Building mutation for ID:', id);
        return {
          url: `/projects/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Project"],
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