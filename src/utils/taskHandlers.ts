import { useCallback } from "react";
import {
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../api/tasks.api";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetCommentsByTaskQuery,
} from "../api/comments.api";
import {
  showSuccess,
  showWarning,
  confirmRemoveAttachment,
} from "./sweetAlerts";
import type { Task } from "../types";

export const useTaskOperations = (
  task: Task,
  authUser: any,
  isProjectOwner: boolean,
  isProjectMember: boolean
) => {
  /* ---------- RTK mutations ---------- */
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createComment] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const { refetch } = useGetCommentsByTaskQuery(task.id);

  /* ---------- Generic update ---------- */
  const handleUpdate = useCallback(
    async (updates: Partial<Task>) => {
      try {
        await updateTask({ id: task.id, updates }).unwrap();
      } catch {
        showWarning("Failed to update task");
      }
    },
    [task.id, updateTask]
  );

  /* ---------- Delete task (shared) ---------- */
  const deleteTaskHandler = useCallback(async () => {
    // permission
    if (task.creatorId !== authUser?.id && !isProjectOwner) {
      showWarning("You can only delete your own tasks");
      return;
    }
    // confirm
    if (!(await confirmRemoveAttachment())) return;

    try {
      await deleteTask(task.id).unwrap();
      showSuccess("Task deleted successfully");
    } catch {
      showWarning("Failed to delete task");
    }
  }, [task, authUser?.id, isProjectOwner, deleteTask]);

  /* ---------- File → Base64 ---------- */
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ---------- Upload attachment ---------- */
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const attachments = task.attachments || [];

      if (!file || !isProjectMember || attachments.length >= 3) return;
      if (file.size > 5 * 1024 * 1024) {
        showWarning("File must be under 5 MB");
        return;
      }

      try {
        const base64 = await toBase64(file);
        await updateTask({
          id: task.id,
          updates: { attachments: [...attachments, base64] },
        }).unwrap();
        showSuccess("Attachment uploaded");
      } catch {
        showWarning("Upload failed");
      }
    },
    [task.id, task.attachments, isProjectMember, updateTask]
  );

  /* ---------- Remove attachment ---------- */
  const handleRemoveAttachment = useCallback(
    async (src: string) => {
      if (!isProjectMember) {
        showWarning("No permission");
        return;
      }
      if (!(await confirmRemoveAttachment())) return;

      const attachments = task.attachments || [];
      await updateTask({
        id: task.id,
        updates: { attachments: attachments.filter((a: string) => a !== src) },
      }).unwrap();
      showSuccess("Attachment removed");
    },
    [task.id, task.attachments, isProjectMember, updateTask]
  );

  /* ---------- Add comment ---------- */
  const handleAddComment = useCallback(
    async (commentText: string, setCommentText: (v: string) => void) => {
      if (!commentText.trim()) return;

      try {
        await createComment({
          taskId: task.id,
          userId: authUser.id,
          content: commentText.trim(),
          createdAt: new Date().toISOString(),
        }).unwrap();

        setCommentText("");
        showSuccess("Comment added");
        refetch();
      } catch {
        showWarning("Failed to post comment");
      }
    },
    [task.id, authUser.id, createComment, refetch]
  );

  /* ---------- Delete comment ---------- */
  const handleDeleteComment = useCallback(
    async (id: string, uid: string) => {
      const canDelete = uid === authUser?.id || isProjectOwner;
      if (!canDelete) {
        showWarning("You can only delete your comments");
        return;
      }
      if (!(await confirmRemoveAttachment())) return;

      try {
        await deleteComment(id).unwrap();
        showSuccess("Comment deleted");
        refetch();
      } catch {
        showWarning("Failed to delete comment");
      }
    },
    [authUser?.id, isProjectOwner, deleteComment, refetch]
  );

  return {
    handleUpdate,
    deleteTaskHandler,
    handleUpload,
    handleRemoveAttachment,
    handleAddComment,
    handleDeleteComment,
    toBase64,
  };
};