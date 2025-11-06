// src/views/TaskListView.tsx
import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import type { RootState } from "../../store";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { motion, AnimatePresence } from "framer-motion";
import TaskItem from "./TaskItem";
import type { User } from "../../types";

interface TaskListViewProps {
  projectId: string;
}

export default function TaskListView({ projectId }: TaskListViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByProjectQuery(projectId);
  const { data: project } = useGetProjectByIdQuery(projectId);
  const { data: users = [] } = useGetAllUsersQuery();
  const { searchQuery, filterPriority } = useSelector((state: RootState) => state.tasks);
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