// src/api/users.api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import type { User, NewUser } from "../types";
import { authorizedBaseQuery } from "../lib/authorizedBaseQuery";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: authorizedBaseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getAllUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["User"],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["User"],
    }),

    updateUser: builder.mutation<User, { id: string; updates: Partial<User> }>({
      query: ({ id, updates }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;