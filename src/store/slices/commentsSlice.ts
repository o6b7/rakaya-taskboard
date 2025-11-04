import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Comment } from "../../types";

interface CommentsState {
  commentsByTask: Record<string, Comment[]>;
  loading: boolean;
}

const initialState: CommentsState = {
  commentsByTask: {},
  loading: false,
};

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setCommentsForTask: (
      state,
      action: PayloadAction<{ taskId: string; comments: Comment[] }>
    ) => {
      state.commentsByTask[action.payload.taskId] = action.payload.comments;
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      const { taskId } = action.payload;
      if (!state.commentsByTask[taskId]) {
        state.commentsByTask[taskId] = [];
      }
      state.commentsByTask[taskId].push(action.payload);
    },
    removeComment: (
      state,
      action: PayloadAction<{ taskId: string; commentId: string }>
    ) => {
      const { taskId, commentId } = action.payload;
      if (state.commentsByTask[taskId]) {
        state.commentsByTask[taskId] = state.commentsByTask[taskId].filter(
          (c) => c.id !== commentId
        );
      }
    },
  },
});

export const { setCommentsForTask, addComment, removeComment } =
  commentsSlice.actions;
export default commentsSlice.reducer;
