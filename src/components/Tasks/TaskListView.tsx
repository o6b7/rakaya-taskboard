import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import { useAppDispatch, type RootState } from "../../store";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";
import type { User } from "../../types";
import { setFilterPriority, setFilterStatus, setSearchQuery } from "../../store/slices/tasksSlice";

interface TaskListViewProps {
  projectId: string;
}

export default function TaskListView({ projectId }: TaskListViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();

  // Redux state
  const { searchQuery, filterPriority, filterStatus } = useSelector((state: RootState) => state.tasks);
  const dispatch = useAppDispatch();

  // Local UI state
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [openAttachmentId, setOpenAttachmentId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const authUser = useMemo<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isProjectOwner = project?.ownerId === authUser?.id;
  const isProjectMember = project?.members?.includes(authUser?.id) || isProjectOwner;

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  // Filter + Sort
  const sortedAndFilteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => Number(b.pinned) - Number(a.pinned));
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
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        {/* Priority Buttons */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All", icon: "Filter" },
            { value: "High", label: "High", icon: "AlertTriangle", color: "text-red-600 dark:text-red-400" },
            { value: "Medium", label: "Medium", icon: "Minus", color: "text-amber-600 dark:text-amber-400" },
            { value: "Low", label: "Low", icon: "ArrowDown", color: "text-green-600 dark:text-green-400" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => dispatch(setFilterPriority(opt.value as any))}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 active:scale-95
                ${filterPriority === opt.value
                  ? "bg-primary-500 text-white border-primary-500 shadow-md"
                  : "bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              {getLucideIcon(opt.icon, { className: `w-3.5 h-3.5 ${opt.color || ""}` })}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => dispatch(setFilterStatus(e.target.value as any))}
          className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all"
        >
          {[
            { value: "all", label: "All Status" },
            { value: "backlog", label: "Backlog" },
            { value: "todo", label: "To Do" },
            { value: "inprogress", label: "In Progress" },
            { value: "needreview", label: "Need Review" },
            { value: "done", label: "Done" },
          ].map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* TASK LIST */}
      {sortedAndFilteredTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredTasks.map((task) => {
            const isOpen = openTaskId === task.id;
            const isAttachmentOpen = openAttachmentId === task.id;
            return (
              <TaskItem
                key={task.id}
                task={task}
                authUser={authUser}
                isProjectOwner={isProjectOwner}
                isProjectMember={isProjectMember}
                isOpen={isOpen}
                viewMode="list"
                isAttachmentOpen={isAttachmentOpen}
                onToggleComments={() => setOpenTaskId(isOpen ? null : task.id)}
                onToggleAttachments={() => setOpenAttachmentId(isAttachmentOpen ? null : task.id)}
                onPreviewImage={setPreviewImage}
                getUserById={getUserById}
              />
            );
          })}
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
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
      className="flex flex-col items-center justify-center py-24 text-center dark:text-white"
    >
      <div className="mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-5 dark:from-gray-800 dark:to-gray-900">
        {getLucideIcon("ClipboardList", { className: "h-12 w-12 text-gray-400 dark:text-gray-600" })}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">No tasks found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new task.</p>
    </motion.div>
  );
}