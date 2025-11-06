// src/views/TaskTableView.tsx
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import type { RootState } from "../../store";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";
import type { User } from "../../types";

interface TaskTableViewProps {
  projectId: string;
}

export default function TaskTableView({ projectId }: TaskTableViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();
  const { searchQuery, filterPriority } = useSelector((state: RootState) => state.tasks);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [openAttachmentTask, setOpenAttachmentTask] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const authUser = useMemo<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isProjectOwner = project?.ownerId === authUser?.id;
  const isProjectMember = project?.members?.includes(authUser?.id) || isProjectOwner;

  const getUserById = (id: string) => users.find((u) => u.id === id);

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

  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface dark:shadow-card-dark dark:border-dark-border">
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

      {/* Image Preview Modal */}
        <AnimatePresence>
            {previewImage && (
                <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewImage(null)} // Close when clicking backdrop
                >
                <motion.img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-[80vh] rounded-xl shadow-lg cursor-pointer"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}