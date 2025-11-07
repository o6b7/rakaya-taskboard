// src/views/TaskTableView.tsx
import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import type { RootState } from "../../store";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";
import type { User } from "../../types";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { setSearchQuery, setFilterPriority } from "../../store/slices/tasksSlice";   // <-- NEW

interface TaskTableViewProps {
  projectId: string;
}

export default function TaskTableView({ projectId }: TaskTableViewProps) {
  const dispatch = useDispatch();
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();

  const { searchQuery, filterPriority } = useSelector((s: RootState) => s.tasks);
  const [filterStatus, setFilterStatus] = useState("all");               // <-- local status filter
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [openAttachmentTask, setOpenAttachmentTask] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const authUser = useMemo<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isProjectOwner = project?.ownerId === authUser?.id;
  const isProjectMember = project?.members?.includes(authUser?.id) || isProjectOwner;
  const getUserById = (id: string) => users.find((u) => u.id === id);

  /* ---------- FILTER LOGIC ---------- */
  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    return sorted.filter((task) => {
      const matchesQuery =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      const matchesStatus = filterStatus === "all" || task.column === filterStatus;

      return matchesQuery && matchesPriority && matchesStatus;
    });
  }, [tasks, searchQuery, filterPriority, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500 dark:text-dark-muted">Loading tasks...</div>
      </div>
    );
  }

  /* ---------- PRIORITY & STATUS UI ---------- */
  const priorityOpts = [
    { v: "all", l: "All", i: "Filter" },
    { v: "High", l: "High", i: "AlertTriangle", c: "text-red-600" },
    { v: "Medium", l: "Medium", i: "Minus", c: "text-amber-600" },
    { v: "Low", l: "Low", i: "ArrowDown", c: "text-green-600" },
  ];

  const statusOpts = [
    { v: "all", l: "All" },
    { v: "backlog", l: "Backlog" },
    { v: "todo", l: "To Do" },
    { v: "inprogress", l: "In Progress" },
    { v: "needreview", l: "Need Review" },
    { v: "done", l: "Done" },
  ];

  return (
    <>
      {/* ───── FILTER BAR ───── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-border dark:border-gray-700">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            {getLucideIcon("Search", {
              className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500",
            })}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Priority buttons */}
        <div className="flex gap-2 flex-wrap">
          {priorityOpts.map((o) => (
            <button
              key={o.v}
              onClick={() => dispatch(setFilterPriority(o.v as any))}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 active:scale-95
                ${filterPriority === o.v
                  ? "bg-primary-500 text-white border-primary-500 shadow-md"
                  : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              {getLucideIcon(o.i, { className: `w-3.5 h-3.5 ${o.c || ""}` })}
              {o.l}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => dispatch(setFilterStatus(e.target.value as any))}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all"
        >
          {statusOpts.map((s) => (
            <option key={s.v} value={s.v} className="bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text">
              {s.l}
            </option>
          ))}
        </select>

      </div>

      {/* ───── MOBILE TABLE (horizontal scroll) ───── */}
      <div className="sm:hidden w-80 mx-auto overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface dark:border-dark-border">
        <div className="min-w-[640px]">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                {[
                  { label: "Task", align: "text-left" },
                  { label: "Priority", align: "text-center" },
                  { label: "Status", align: "text-center" },
                  { label: "Deadline", align: "text-center" },
                  { label: "Created", align: "text-center" },
                  { label: "Actions", align: "text-center" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`${h.align} px-4 py-3 text-xs font-medium text-gray-600 dark:text-dark-muted uppercase tracking-wider`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-dark-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-dark-muted text-sm">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOpen = openTask === task.id;
                  const isAttachmentOpen = openAttachmentTask === task.id;
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      authUser={authUser}
                      isProjectOwner={isProjectOwner}
                      isProjectMember={isProjectMember}
                      viewMode="table"
                      isOpen={isOpen}
                      isAttachmentOpen={isAttachmentOpen}
                      onToggleComments={() => setOpenTask(isOpen ? null : task.id)}
                      onToggleAttachments={() => setOpenAttachmentTask(isAttachmentOpen ? null : task.id)}
                      onPreviewImage={setPreviewImage}
                      getUserById={getUserById}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───── DESKTOP TABLE ───── */}
      <div className="hidden sm:block w-full overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface dark:border-dark-border">
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
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 text-center dark:text-white"
                  >
                    <div className="mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-5 dark:from-gray-800 dark:to-gray-900">
                      {getLucideIcon("ClipboardList", { className: "h-12 w-12 text-gray-400 dark:text-gray-600" })}
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-foreground">No tasks found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new task.</p>
                  </motion.div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const isOpen = openTask === task.id;
                const isAttachmentOpen = openAttachmentTask === task.id;
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    authUser={authUser}
                    isProjectOwner={isProjectOwner}
                    isProjectMember={isProjectMember}
                    viewMode="table"
                    isOpen={isOpen}
                    isAttachmentOpen={isAttachmentOpen}
                    onToggleComments={() => setOpenTask(isOpen ? null : task.id)}
                    onToggleAttachments={() => setOpenAttachmentTask(isAttachmentOpen ? null : task.id)}
                    onPreviewImage={setPreviewImage}
                    getUserById={getUserById}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ───── IMAGE PREVIEW MODAL ───── */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}