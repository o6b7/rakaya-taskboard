import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User, UserProfile, NewUser } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

export const usersApi = createApi({
  reducerPath: 'usersApi',
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
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getAllUsers: builder.query<UserProfile[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUserById: builder.query<UserProfile, string>({
      query: (id) => `/users/${id}`,
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, NewUser>({
      query: (newUser) => {
        const userWithId: User = {
          ...newUser,
          id: generateUniqueId('users'),
        };
        return {
          url: '/users',
          method: 'POST',
          body: userWithId,
        };
      },
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: string; updates: Partial<User> }>({
      query: ({ id, updates }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;