import React, { useState, useMemo, useRef } from "react";
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

interface TaskTableViewProps {
  projectId: string;
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  High: { bg: "bg-danger-100 dark:bg-danger-900", text: "text-danger-700 dark:text-danger-300", dot: "bg-danger-500" },
  Medium: { bg: "bg-warning-100 dark:bg-warning-900", text: "text-warning-700 dark:text-warning-300", dot: "bg-warning-500" },
  Low: { bg: "bg-success-100 dark:bg-success-900", text: "text-success-700 dark:text-success-300", dot: "bg-success-500" },
};

const statusOptions = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "inprogress", label: "In Progress" },
  { value: "needreview", label: "Need Review" },
  { value: "done", label: "Done" },
];

const statusStyle: Record<string, { bg: string; text: string }> = {
  done: { bg: "bg-success-100 dark:bg-success-900", text: "text-success-700 dark:text-success-300" },
  inprogress: { bg: "bg-warning-100 dark:bg-warning-900", text: "text-warning-700 dark:text-warning-300" },
  needreview: { bg: "bg-primary-100 dark:bg-primary-900", text: "text-primary-700 dark:text-primary-300" },
  todo: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300" },
  backlog: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

export default function TaskTableView({ projectId }: TaskTableViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const { searchQuery, filterPriority } = useSelector((state: RootState) => state.tasks);

  const [openTask, setOpenTask] = useState<string | null>(null);
  const [openAttachmentTask, setOpenAttachmentTask] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const authUser = useMemo(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isProjectOwner = project?.ownerId === authUser?.id;
  const isProjectMember = project?.members?.includes(authUser?.id) || isProjectOwner;

  const getUserById = (id: string) => users.find(u => u.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500 dark:text-dark-muted">Loading tasks...</div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const filteredTasks = sortedTasks.filter((task) => {
    const matchesQuery =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.column === filterStatus;
    return matchesQuery && matchesPriority && matchesStatus;
  });

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await updateTask({ id, updates }).unwrap();
    } catch {
      showWarning("Update failed");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || (task.creatorId !== authUser?.id && !isProjectOwner)) {
      showWarning("You can only delete your own tasks");
      return;
    }
    if (!(await confirmRemoveAttachment())) return;
    try {
      await deleteTask(taskId).unwrap();
      showSuccess("Task deleted");
    } catch {
      showWarning("Failed to delete task");
    }
  };

  return (
    <div className="w-80 md:w-full overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface dark:shadow-card-dark dark:border-dark-border">
      <table className="w-full table-auto border-collapse">
        <thead>
            <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                {[
                { label: "Task", align: "text-left" },
                { label: "Priority", align: "text-center" },
                { label: "Status", align: "text-center" },
                { label: "Deadline", align: "text-center" },
                { label: "Created At", align: "text-center" },
                { label: "Actions", align: "text-center" },
                ].map((h) => (
                <th
                    key={h.label}
                    className={`${h.align} px-6 py-4 font-medium text-sm text-gray-700 dark:text-dark-text uppercase tracking-wider`}
                >
                    {h.label}
                </th>
                ))}
            </tr>
            </thead>
        <tbody className="divide-y divide-surface-border dark:divide-dark-border">
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-dark-muted">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium">No tasks found</p>
                  <p className="text-xs opacity-75 mt-1">Create your first task to get started</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
                authUser={authUser}
                isProjectOwner={isProjectOwner}
                isProjectMember={isProjectMember}
                openTask={openTask}
                setOpenTask={setOpenTask}
                openAttachmentTask={openAttachmentTask}
                setOpenAttachmentTask={setOpenAttachmentTask}
                previewImage={previewImage}
                setPreviewImage={setPreviewImage}
                deleteTask={handleDeleteTask}
                updateTask={handleUpdate}
                getUserById={getUserById}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-xl shadow-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === TaskRow Component ===
function TaskRow({
  task,
  project,
  authUser,
  isProjectOwner,
  isProjectMember,
  openTask,
  setOpenTask,
  openAttachmentTask,
  setOpenAttachmentTask,
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
  const assignees = (task.assigneeIds || []).map(getUserById).filter(Boolean);
  const priority = priorityConfig[task.priority];
  const status = statusStyle[task.column] || statusStyle.backlog;

  const canDeleteTask = task.creatorId === authUser?.id || isProjectOwner;
  const canDeleteComment = (uid: string) => uid === authUser?.id || isProjectOwner;
  const canModifyAttachments = isProjectMember;

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canModifyAttachments || attachments.length >= 3) return;
    if (file.size > 5 * 1024 * 1024) return showWarning("Max 5MB");
    try {
      const base64 = await toBase64(file);
      await updateTask(task.id, { attachments: [...attachments, base64] });
      showSuccess("Uploaded");
    } catch {
      showWarning("Upload failed");
    }
  };

  const handleRemoveAttachment = async (src: string) => {
    if (!canModifyAttachments) return showWarning("No permission");
    if (!(await confirmRemoveAttachment())) return;
    await updateTask(task.id, { attachments: attachments.filter((a: string) => a !== src) });
    showSuccess("Removed");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment({
        taskId: task.id,
        userId: authUser.id,
        content: commentText,
        createdAt: new Date().toISOString(),
      }).unwrap();
      setCommentText("");
      showSuccess("Comment added");
    } catch {
      showWarning("Failed");
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
      showWarning("Failed");
    }
  };

  return (
    <>
        <tr className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors duration-150">
            <td className="px-6 py-4">
                <div className="flex items-start gap-3">
                {/* Fixed Pin Block */}
                <div className="w-6 h-6 flex items-center justify-center mt-0.5">
                    {task.pinned ? (
                    <div className="text-amber-500">
                        {getLucideIcon("Pin", { className: "w-4 h-4 rotate-45" })}
                    </div>
                    ) : (
                    <div className="w-4 h-4" />
                    )}
                </div>
                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm truncate">{task.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-dark-muted line-clamp-2 mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                    <Avatar name={creator?.name || "Unknown"} avatar={creator?.avatar} size={20} />
                    <span className="text-xs text-gray-500 dark:text-dark-muted">by {creator?.name || "Unknown"}</span>
                    </div>
                </div>
                </div>
            </td>

            {/* Priority */}
            <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${priority.bg} ${priority.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {task.priority}
                </span>
            </td>

            {/* Status */}
            <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                <select
                    value={task.column}
                    onChange={(e) => updateTask(task.id, { column: e.target.value })}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${status.bg} ${status.text}`}
                >
                    {statusOptions.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                </div>
            </td>

            {/* Deadline */}
            <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-dark-text">
                {task.deadline ? format(new Date(task.deadline), "dd MMM yyyy") : "-"}
            </td>

            {/* Created */}
            <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-dark-muted">
                {format(new Date(task.createdAt), "dd MMM yyyy")}
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-dark-muted">
                {/* Delete */}
                <div className="w-8 h-8 flex items-center justify-center">
                    {canDeleteTask ? (
                    <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-danger-600 rounded-lg transition-colors w-full h-full flex items-center justify-center"
                        title="Delete task"
                    >
                        {getLucideIcon("Trash2", { className: "w-4 h-4" })}
                    </button>
                    ) : (
                    <div className="w-full h-full" />
                    )}
                </div>

                {/* Pin */}
                <div className="w-8 h-8 flex items-center justify-center">
                    <button
                    onClick={() => updateTask(task.id, { pinned: !task.pinned })}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full h-full flex items-center justify-center"
                    title={task.pinned ? "Unpin task" : "Pin task"}
                    >
                    {getLucideIcon(task.pinned ? "Pin" : "PinOff", { className: "w-4 h-4" })}
                    </button>
                </div>

                {/* Comments */}
                <div className="w-8 h-8 flex items-center justify-center relative">
                    <button
                    onClick={() => setOpenTask(openTask === task.id ? null : task.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full h-full flex items-center justify-center"
                    title={`${comments.length} comments`}
                    >
                    {getLucideIcon("MessageSquare", { className: "w-4 h-4" })}
                    </button>
                    {comments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
                        {comments.length}
                    </span>
                    )}
                </div>

                {/* Attachments */}
                <div className="w-8 h-8 flex items-center justify-center relative">
                    <button
                    onClick={() => setOpenAttachmentTask(openAttachmentTask === task.id ? null : task.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full h-full flex items-center justify-center"
                    title={`${attachments.length} attachments`}
                    >
                    {getLucideIcon("Paperclip", { className: "w-4 h-4" })}
                    </button>
                    {attachments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
                        {attachments.length}
                    </span>
                    )}
                </div>
                </div>
            </td>
        </tr>

      {/* Attachments Row */}
      <AnimatePresence>
        {openAttachmentTask === task.id && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={6} className="bg-gray-50 dark:bg-dark-surface/40 px-6 py-4">
              <div className="flex flex-wrap gap-3 mb-3">
                {attachments.length ? (
                  attachments.map((src: string, i: number) => (
                    <div key={i} className="relative w-24 h-24 border rounded-lg overflow-hidden group cursor-pointer">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        onClick={() => setPreviewImage(src)}
                      />
                      {canModifyAttachments && (
                        <button
                          onClick={() => handleRemoveAttachment(src)}
                          className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          {getLucideIcon("X", { className: "w-3 h-3" })}
                        </button>
                      )}
                    </div>
                  ))
                )  : (
                  <p className="text-sm text-gray-500">No attachments</p>
                )}
              </div>
              {canModifyAttachments && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length >= 3}
                    className={attachments.length >= 3 ? "opacity-50" : ""}
                  >
                    {getLucideIcon("Upload", { className: "w-4 h-4 mr-1" })} Upload
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  {attachments.length >= 3 && <span className="text-xs text-gray-500">Max 3</span>}
                </div>
              )}
            </td>
          </motion.tr>
        )}
      </AnimatePresence>

      {/* Comments Row */}
      <AnimatePresence>
        {openTask === task.id && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={6} className="bg-gray-50 dark:bg-dark-surface/40 px-6 py-4">
              <p className="font-semibold text-sm dark:text-dark-text mb-2">Comments</p>
              {loadingComments ? (
                <p className="text-xs text-gray-500">Loading...</p>
              ) : comments.length ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comments.map((c: any) => {
                    const canDel = canDeleteComment(c.userId);
                    const commenter = getUserById(c.userId);
                    return (
                      <div key={c.id} className="flex items-start gap-2 p-2 bg-white dark:bg-dark-card border rounded-md text-xs">
                        <Avatar name={commenter?.name} avatar={commenter?.avatar} size={28} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 dark:text-dark-text">{commenter?.name || c.userId}</p>
                          <p className="text-gray-600 dark:text-dark-muted">{c.content}</p>
                        </div>
                        {canDel && (
                          <button
                            onClick={() => handleDeleteComment(c.id, c.userId)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No comments yet.</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Write a comment..."
                  className="flex-1 text-sm border rounded-md px-2 py-1 dark:bg-dark-card dark:border-dark-border"
                />
                <Button size="sm" onClick={handleAddComment}>Post</Button>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}