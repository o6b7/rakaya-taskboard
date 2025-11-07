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
  confirmAction,
  showError,
  showWarning,
} from "./sweetAlerts";
import type { Task } from "../types";
import { compressImage } from "./CompressImage";

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
    // 🧠 Permission check
    if (task.creatorId !== authUser?.id && !isProjectOwner) {
      showWarning("You can only delete your own tasks");
      return;
    }

    // 🧾 Confirmation popup
    const confirmed = await confirmAction({
      title: "Delete this task?",
      text: "This action cannot be undone.",
      icon: "warning",
      confirmText: "Yes, delete it!",
      cancelText: "Cancel",
      confirmColor: "#d33",
    });

    if (!confirmed.isConfirmed) return;

    try {
      await deleteTask(task.id).unwrap();
      await showSuccess("Deleted!", "Task deleted successfully.");
    } catch (err) {
      await showError("Error", "Failed to delete task.");
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

      // Permission & limit checks
      if (!file || !isProjectMember) return;
      if (attachments.length >= 3) {
        showWarning("Maximum 3 attachments allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showWarning("File must be under 5 MB");
        return;
      }

      try {
        let base64: string;

        // Compress image files
        if (file.type.startsWith("image/")) {
          base64 = await compressImage(file, {
            maxWidth: 800,
            quality: 0.8,
            format: "jpeg",
          });
        } else {
          // Non-image: just convert to base64 (PDF, DOC, etc.)
          base64 = await toBase64(file);
        }

        // Final safety check: reject if still too big (> 300 KB after compression)
        if (base64.length > 400 * 1024) {
          showWarning("File too large after compression. Try a smaller image.");
          return;
        }

        await updateTask({
          id: task.id,
          updates: { attachments: [...attachments, base64] },
        }).unwrap();

        showSuccess("Attachment uploaded");
      } catch (err: any) {
        console.error("Upload error:", err);
        showWarning("Upload failed. File may be corrupted or too large.");
      }
    },
    [task.id, task.attachments, isProjectMember, updateTask]
  );

  /* ---------- Remove attachment ---------- */
  const handleRemoveAttachment = useCallback(
    async (src: string) => {
      if (!isProjectMember) {
        showError("No permission");
        return;
      }

      // 🧾 SweetAlert confirmation
      const confirmed = await confirmAction({
        title: "Remove this attachment?",
        text: "This action cannot be undone.",
        icon: "warning",
        confirmText: "Yes, remove it!",
        cancelText: "Cancel",
        confirmColor: "#d33",
      });

      if (!confirmed.isConfirmed) return;

      try {
        const attachments = task.attachments || [];
        await updateTask({
          id: task.id,
          updates: { attachments: attachments.filter((a: string) => a !== src) },
        }).unwrap();

        await showSuccess("Attachment removed", "The file has been successfully removed.");
      } catch (err) {
        await showError("Error", "Failed to remove attachment.");
        console.error("Attachment removal error:", err);
      }
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
        showError("Failed to post comment");
      }
    },
    [task.id, authUser.id, createComment, refetch]
  );

  /* ---------- Delete comment ---------- */
  const handleDeleteComment = useCallback(
    async (id: string, uid: string) => {
      const canDelete = uid === authUser?.id || isProjectOwner;
      if (!canDelete) {
        showError("You can only delete your own comments");
        return;
      }

      // 🧾 SweetAlert confirmation
      const confirmed = await confirmAction({
        title: "Delete this comment?",
        text: "This action cannot be undone.",
        icon: "warning",
        confirmText: "Yes, delete it",
        cancelText: "Cancel",
        confirmColor: "#d33",
      });

      if (!confirmed.isConfirmed) return;

      try {
        await deleteComment(id).unwrap();
        await showSuccess("Comment deleted", "The comment has been successfully removed.");
        refetch();
      } catch (err) {
        await showError("Error", "Failed to delete comment.");
        console.error("Comment deletion error:", err);
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