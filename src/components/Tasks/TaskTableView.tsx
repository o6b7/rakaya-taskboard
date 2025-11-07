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
import { getLucideIcon } from "../../lib/getLucideIcon";

interface TaskListViewProps {
  projectId: string;
}

export default function TaskTableView({ projectId }: TaskListViewProps) {
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
    <>
      {/* Mobile: Fixed width + horizontal scroll */}
      <div className="sm:hidden w-80 mx-auto overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface dark:border-dark-border">
        <div className="min-w-[640px]"> {/* Forces horizontal scroll */}
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

      {/* Desktop: Full width */}
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

      {/* Image Preview Modal */}
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