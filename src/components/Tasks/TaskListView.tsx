import React, { useState, useMemo, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../../api/tasks.api";
import {
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from "../../api/comments.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import type { RootState } from "../../store";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";
import { confirmRemoveAttachment, showSuccess, showWarning } from "../../utils/sweetAlerts";
import Avatar from "../Common/Avatar";

interface TaskListViewProps {
  projectId: string;
}

const priorityConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  High: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", label: "High" },
  Medium: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", label: "Medium" },
  Low: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", dot: "bg-green-500", label: "Low" },
};

const statusConfig: Record<
  string,
  { bg: string; text: string; label: string; icon: string }
> = {
  backlog: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: "Backlog", icon: "Circle" },
  todo: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", label: "To Do", icon: "Circle" },
  inprogress: { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300", label: "In Progress", icon: "Loader2" },
  needreview: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", label: "Need Review", icon: "Eye" },
  done: { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-300", label: "Done", icon: "CheckCircle" },
};

export default function TaskListView({ projectId }: TaskListViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const { searchQuery, filterPriority } = useSelector((state: RootState) => state.tasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [openAttachmentId, setOpenAttachmentId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const authUser = useMemo(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isProjectOwner = project?.ownerId === authUser?.id;
  const isProjectMember = project?.members?.includes(authUser?.id) || isProjectOwner;

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const sortedAndFilteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return sorted.filter((task) => {
      const matchesQuery =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      return matchesQuery && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<any>) => {
      try {
        await updateTask({ id, updates }).unwrap();
      } catch {
        showWarning("Failed to update task");
      }
    },
    [updateTask]
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || (task.creatorId !== authUser?.id && !isProjectOwner)) {
        showWarning("You can only delete your own tasks");
        return;
      }
      if (!(await confirmRemoveAttachment())) return;
      try {
        await deleteTask(taskId).unwrap();
        showSuccess("Task deleted successfully");
      } catch {
        showWarning("Failed to delete task");
      }
    },
    [tasks, authUser, isProjectOwner, deleteTask]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-muted-foreground">
          {getLucideIcon("Loader2", { className: "w-5 h-5 animate-spin" })}
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sortedAndFilteredTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={project}
              authUser={authUser}
              isProjectOwner={isProjectOwner}
              isProjectMember={isProjectMember}
              openTaskId={openTaskId}
              setOpenTaskId={setOpenTaskId}
              openAttachmentId={openAttachmentId}
              setOpenAttachmentId={setOpenAttachmentId}
              previewImage={previewImage}
              setPreviewImage={setPreviewImage}
              updateTask={handleUpdate}
              deleteTask={handleDelete}
              getUserById={getUserById}
            />
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-full overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="Preview" className="max-h-screen w-full object-contain" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 backdrop-blur-sm transition hover:bg-white/20"
              >
                {getLucideIcon("X", { className: "w-5 h-5 text-white" })}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-5 dark:from-gray-800 dark:to-gray-900">
        {getLucideIcon("ClipboardList", { className: "h-12 w-12 text-gray-400 dark:text-gray-600" })}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">No tasks found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new task.</p>
    </motion.div>
  );
}

function TaskCard({
  task,
  project,
  authUser,
  isProjectOwner,
  isProjectMember,
  openTaskId,
  setOpenTaskId,
  openAttachmentId,
  setOpenAttachmentId,
  previewImage,
  setPreviewImage,
  updateTask,
  deleteTask,
  getUserById,
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: comments = [], isLoading: loadingComments, refetch } = useGetCommentsByTaskQuery(task.id);
  const [createComment] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [commentText, setCommentText] = useState("");

  const attachments = task.attachments || [];
  const creator = getUserById(task.creatorId);
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const status = statusConfig[task.column] || statusConfig.backlog;

  const canEdit = task.creatorId === authUser?.id || isProjectOwner;
  const canDeleteComment = (uid: string) => uid === authUser?.id || isProjectOwner;

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isProjectMember || attachments.length >= 3) return;
    if (file.size > 5 * 1024 * 1024) {
      showWarning("File must be under 5MB");
      return;
    }
    try {
      const base64 = await toBase64(file);
      await updateTask(task.id, { attachments: [...attachments, base64] });
      showSuccess("Attachment uploaded");
    } catch {
      showWarning("Upload failed");
    }
  };

  const handleRemoveAttachment = async (src: string) => {
    if (!isProjectMember) return showWarning("No permission");
    if (!(await confirmRemoveAttachment())) return;
    await updateTask(task.id, { attachments: attachments.filter((a: string) => a !== src) });
    showSuccess("Attachment removed");
  };

  const handleAddComment = async () => {
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
  };

  const handleDeleteComment = async (id: string, uid: string) => {
    if (!canDeleteComment(uid)) return showWarning("You can only delete your comments");
    if (!(await confirmRemoveAttachment())) return;
    try {
      await deleteComment(id).unwrap();
      showSuccess("Comment deleted");
      refetch();
    } catch {
      showWarning("Failed to delete comment");
    }
  };

  const isOpen = openTaskId === task.id;
  const isAttachmentOpen = openAttachmentId === task.id;

  const ActionButtons = () => (
    <div className="flex items-center gap-1.5">
      {canEdit && (
        <button
          onClick={() => deleteTask(task.id)}
          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete task"
          aria-label="Delete task"
        >
          {getLucideIcon("Trash2", { className: "h-4 w-4" })}
        </button>
      )}
      <button
        onClick={() => updateTask(task.id, { pinned: !task.pinned })}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
        title={task.pinned ? "Unpin" : "Pin"}
        aria-label={task.pinned ? "Unpin task" : "Pin task"}
      >
        {getLucideIcon(task.pinned ? "Pin" : "PinOff", { className: "h-4 w-4" })}
      </button>
      <button
        onClick={() => setOpenTaskId(isOpen ? null : task.id)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
        title={`${comments.length} comments`}
        aria-label={`Toggle comments (${comments.length})`}
      >
        {getLucideIcon("MessageSquare", { className: "h-4 w-4" })}
        {comments.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {comments.length}
          </span>
        )}
      </button>
      <button
        onClick={() => setOpenAttachmentId(isAttachmentOpen ? null : task.id)}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
        title={`${attachments.length} attachments`}
        aria-label={`Toggle attachments (${attachments.length})`}
      >
        {getLucideIcon("Paperclip", { className: "h-4 w-4" })}
        {attachments.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white">
            {attachments.length}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:shadow-none"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {task.pinned && (
                <span className="text-amber-500" title="Pinned task">
                  {getLucideIcon("Pin", { className: "h-4 w-4 rotate-45" })}
                </span>
              )}
              <h3 className="truncate text-base font-semibold text-foreground">{task.title}</h3>
            </div>

            {task.description && (
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${priority.bg} ${priority.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>

              <button
                onClick={() => {
                  const options = Object.keys(statusConfig);
                  const currentIndex = options.indexOf(task.column);
                  const nextStatus = options[(currentIndex + 1) % options.length];
                  updateTask(task.id, { column: nextStatus });
                }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${status.bg} ${status.text} hover:opacity-80`}
                title="Click to change status"
              >
                {getLucideIcon(status.icon, { className: "h-3 w-3" })}
                {status.label}
              </button>

              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  {getLucideIcon("Calendar", { className: "h-3.5 w-3.5" })}
                  {format(new Date(task.deadline), "dd MMM")}
                </span>
                <span className="flex items-center gap-1">
                  {getLucideIcon("Clock", { className: "h-3.5 w-3.5" })}
                  {format(new Date(task.createdAt), "dd MMM")}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex">
            <ActionButtons />
          </div>
        </div>

        {/* Creator */}
        <div className="mt-4 flex items-center gap-2 pt-3">
          <Avatar name={creator?.name} avatar={creator?.avatar} size={22} />
          <span className="text-xs text-muted-foreground">
            Created by <span className="font-medium text-foreground">{creator?.name || "Unknown"}</span>
          </span>
        </div>
      </div>

      {/* Mobile Action Bar - Fixed at Bottom */}
      <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm sticky bottom-0 z-10">
        <div className="flex justify-center p-3">
          <ActionButtons />
        </div>
      </div>

      {/* Attachments Panel */}
      <AnimatePresence>
        {isAttachmentOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-muted/30 px-5 py-4"
          >
            <div className="mb-3 flex flex-wrap gap-3">
              {attachments.length > 0 ? (
                attachments.map((src: string, i: number) => (
                  <div
                    key={i}
                    className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-transform hover:scale-105"
                    onClick={() => setPreviewImage(src)}
                  >
                    <img src={src} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
                    {isProjectMember && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(src);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white md:opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove attachment"
                      >
                        {getLucideIcon("X", { className: "h-3 w-3" })}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No attachments yet.</p>
              )}
            </div>

            {isProjectMember && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 3}
                  className={attachments.length >= 3 ? "opacity-50" : ""}
                >
                  {getLucideIcon("Upload", { className: "mr-1 h-4 w-4" })} Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                {attachments.length >= 3 && <span className="text-xs text-muted-foreground">Max 3 files</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-muted/30 px-5 py-4"
          >
            <h4 className="mb-3 text-sm font-semibold text-foreground">Comments</h4>

            {loadingComments ? (
              <p className="text-xs text-muted-foreground">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {comments.map((c: any) => {
                  const commenter = getUserById(c.userId);
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs shadow-sm"
                    >
                      <Avatar name={commenter?.name} avatar={commenter?.avatar} size={28} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{commenter?.name || "User"}</p>
                        <p className="mt-0.5 text-muted-foreground">{c.content}</p>
                      </div>
                      {canDeleteComment(c.userId) && (
                        <button
                          onClick={() => handleDeleteComment(c.id, c.userId)}
                          className="text-red-600 transition-colors hover:text-red-700"
                          aria-label="Delete comment"
                        >
                          {getLucideIcon("Trash2", { className: "h-3.5 w-3.5" })}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Write a comment"
              />
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                Post
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}