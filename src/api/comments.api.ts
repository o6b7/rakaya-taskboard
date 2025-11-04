import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Comment, NewComment } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
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
  tagTypes: ['Comment'],
  endpoints: (builder) => ({
    getCommentsByTask: builder.query<Comment[], string>({
      query: (taskId) => `/comments?taskId=${taskId}`,
      providesTags: ['Comment'],
    }),
    createComment: builder.mutation<Comment, NewComment>({
      query: (newComment) => {
        const commentWithId: Comment = {
          ...newComment,
          id: generateUniqueId('comments'),
        };
        return {
          url: '/comments',
          method: 'POST',
          body: commentWithId,
        };
      },
      invalidatesTags: ['Comment'],
    }),
    updateComment: builder.mutation<Comment, { id: string; updates: Partial<Comment> }>({
      query: ({ id, updates }) => ({
        url: `/comments/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Comment'],
    }),
    deleteComment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Comment'],
    }),
  }),
});

export const {
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentsApi;