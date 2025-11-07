import { createApi } from "@reduxjs/toolkit/query/react";
import type { Comment, NewComment } from "../types";
import { authorizedBaseQuery } from "../lib/authorizedBaseQuery";

export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: authorizedBaseQuery,
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    getCommentsByTask: builder.query<Comment[], string>({
      query: (taskId) => `/comments?taskId=${taskId}`,
      providesTags: ["Comment"],
    }),

    createComment: builder.mutation<Comment, NewComment>({
      query: (newComment) => ({
        url: "/comments",
        method: "POST",
        body: newComment,
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

  }),
});

export const {
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation
} = commentsApi;