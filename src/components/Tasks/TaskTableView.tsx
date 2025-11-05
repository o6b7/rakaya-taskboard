"use client";

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

const priorityColors: Record<string, string> = {
  High: "text-danger-600 bg-danger-50 dark:bg-danger-600/10",
  Medium: "text-warning-600 bg-warning-50 dark:bg-warning-600/10",
  Low: "text-success-600 bg-success-50 dark:bg-success-600/10",
};

const statusOptions = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "inprogress", label: "In Progress" },
  { value: "needreview", label: "Need Review" },
  { value: "done", label: "Done" },
];

export default function TaskTableView({ projectId }: TaskTableViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
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

  if (isLoading) {
    return <div className="text-center py-10 dark:text-dark-text">Loading tasks...</div>;
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
    <div className="rounded-2xl border border-gray-200 dark:border-dark-border shadow-card bg-white dark:bg-dark-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-dark-border">
        <h2 className="text-lg font-semibold dark:text-dark-text">Tasks</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm dark:bg-dark-card dark:border-dark-border"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
          <thead className="bg-gray-50 dark:bg-dark-card hidden md:table-header-group">
            <tr>
              {["Task", "Priority", "Status", "Deadline", "Created At", "Actions"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-dark-text">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
            {filteredTasks.map((task) => (
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
                updateTask={handleUpdate}
                deleteTask={handleDeleteTask}
              />
            ))}
          </tbody>
        </table>
      </div>

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

// === TaskRow – Clean & Reusable ===
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
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: comments = [], isLoading: loadingComments, refetch } = useGetCommentsByTaskQuery(task.id);
  const [createComment] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [commentText, setCommentText] = useState("");

  const attachments = task.attachments || [];
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
      <tr className="hover:bg-gray-50 dark:hover:bg-dark-card transition">
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            {task.pinned && getLucideIcon("Pin", { className: "w-4 h-4 text-amber-500" })}
            <div>
              <p className="font-medium dark:text-dark-text">{task.title}</p>
              <p className="text-sm text-gray-500 dark:text-dark-muted line-clamp-1">{task.description}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </td>
        <td className="px-6 py-3">
          <select
            value={task.column}
            onChange={(e) => updateTask(task.id, { column: e.target.value })}
            className="text-sm border rounded-lg px-2 py-1 dark:bg-dark-card dark:border-dark-border"
          >
            {statusOptions.slice(1).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-3 text-sm dark:text-dark-text">
          {task.deadline ? format(new Date(task.deadline), "dd MMM yyyy") : "-"}
        </td>
        <td className="px-6 py-3 text-sm dark:text-dark-text">
          {format(new Date(task.createdAt), "dd MMM yyyy")}
        </td>
        <td className="px-6 py-3 flex flex-wrap gap-1.5">
          <Button variant="ghost" icon onClick={() => updateTask(task.id, { pinned: !task.pinned })}>
            {getLucideIcon("Pin", { className: "w-4 h-4 text-yellow-500" })}
          </Button>
          <Button variant="ghost" icon onClick={() => setOpenTask(openTask === task.id ? null : task.id)}>
            {getLucideIcon("MessageSquare", { className: "w-4 h-4 text-blue-500" })}
            {comments.length > 0 && <span className="ml-1 text-xs">{comments.length}</span>}
          </Button>
          <Button variant="ghost" icon onClick={() => setOpenAttachmentTask(openAttachmentTask === task.id ? null : task.id)}>
            {getLucideIcon("Paperclip", { className: "w-4 h-4 text-indigo-500" })}
            {attachments.length > 0 && <span className="ml-1 text-xs">{attachments.length}</span>}
          </Button>
          {canDeleteTask && (
            <Button variant="ghost" icon className="text-danger-600" onClick={() => deleteTask(task.id)}>
              {getLucideIcon("Trash2", { className: "w-4 h-4" })}
            </Button>
          )}
        </td>
      </tr>

      {/* Attachments */}
      <AnimatePresence>
        {openAttachmentTask === task.id && (
          <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <td colSpan={6} className="bg-gray-50 dark:bg-dark-surface/40 px-6 py-4">
              <div className="flex flex-wrap gap-3 mb-3">
                {attachments.length ? (
                  attachments.map((src: string, i: number) => (
                    <div key={i} className="relative w-24 h-24 border rounded-lg overflow-hidden group cursor-pointer">
                      <img src={src} alt="" className="w-full h-full object-cover" onClick={() => setPreviewImage(src)} />
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
                ) : (
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

      {/* Comments */}
      <AnimatePresence>
        {openTask === task.id && (
          <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <td colSpan={6} className="bg-gray-50 dark:bg-dark-surface/40 px-6 py-4">
              <p className="font-semibold text-sm dark:text-dark-text mb-2">Comments</p>
              {loadingComments ? (
                <p className="text-xs text-gray-500">Loading...</p>
              ) : comments.length ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comments.map((c: any) => {
                    const canDel = canDeleteComment(c.userId);
                    return (
                      <div key={c.id} className="flex items-start gap-2 p-2 bg-white dark:bg-dark-card border rounded-md text-xs">
                        <Avatar name={c.userId} size={28} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 dark:text-dark-text">{c.userId}</p>
                          <p className="text-gray-600 dark:text-dark-muted">{c.content}</p>
                        </div>
                        {canDel && (
                          <button onClick={() => handleDeleteComment(c.id, c.userId)} className="text-red-500 hover:text-red-700 text-xs">
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