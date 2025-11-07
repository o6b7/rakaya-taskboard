import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { openTaskModal } from "../../store/slices/uiSlice";
import { useDeleteProjectMutation, useGetProjectByIdQuery, useUpdateProjectMutation } from "../../api/projects.api";
import { useDeleteTaskMutation, useGetTasksByProjectQuery } from "../../api/tasks.api";
import BoardView from "../../components/Projects/BoardView";
import {
  LayoutGrid,
  Table,
  Clock,
  List,
  ChevronUp,
  ChevronDown,
  Users,
  Lock,
  LockOpen,
  Calendar,
  Tag,
  FileText,
  User,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useGetAllUsersQuery } from "../../api/users.api";
import Avatar from "../../components/Common/Avatar";
import AddMembersModal from "../../components/Projects/AddProjectMembers";
import { getLucideIcon } from "../../lib/getLucideIcon";
import AddTaskModal from "../../components/Tasks/AddTaskModal";
import TaskTableView from "../../components/Tasks/TaskTableView";
import TaskTimelineView from "../../components/Tasks/TaskTimelineView";
import TaskListView from "../../components/Tasks/TaskListView";
import { useAppSelector, type RootState } from "../../store";
import { AddProjectModal } from "../../components/Projects/AddProjectModal";
import Swal from "sweetalert2";
import { confirmAction, showError, showSuccess } from "../../utils/sweetAlerts";
import { useDeleteCommentMutation } from "../../api/comments.api";
import { motion, AnimatePresence } from "framer-motion";
import ProjectPageSkeleton from "../../components/Skeletons/ProjectPageSkeleton";

export default function ProjectPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams<{ projectId: string }>();
  const sidebarOpen = useSelector((state: any) => state.ui.sidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeProjectTab") || "Board";
  });
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [viewOnlyMembers, setViewOnlyMembers] = useState(false);

  const { data: project, isLoading: loadingProject, refetch: refetchProject } = useGetProjectByIdQuery(projectId!);
  const { data: allUsers } = useGetAllUsersQuery();
  const { data: tasks, isLoading: loadingTasks, refetch } = useGetTasksByProjectQuery(projectId!);
  const [deleteProject] = useDeleteProjectMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updateProject] = useUpdateProjectMutation();

  // Current user from Redux (auth slice) or fallback to localStorage
  const currentUser = useAppSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || localStorage.getItem("userId");

  // Owner and memeber check
  const isOwner = project?.ownerId === currentUserId;
  const isMember = project?.members?.includes(currentUserId as string) || isOwner;

  useEffect(() => {
    localStorage.setItem("activeProjectTab", activeTab);
  }, [activeTab]);

  const handleUpdateMembers = async (updatedUserIds: string[]) => {
    if (!project) return;
    try {
      await updateProject({
        id: project.id,
        updates: { members: updatedUserIds },
      }).unwrap();
      await refetchProject();
      setAddMembersModalOpen(false);
    } catch (err) {
      console.error("Failed to update members:", err);
    }
  };

  // Unified modal opener
  const openMembersModal = (viewOnly: boolean = false) => {
    setViewOnlyMembers(viewOnly);
    setAddMembersModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    const result = await confirmAction({
      title: "Delete this project?",
      text: "This project, its tasks, and all related comments will be permanently deleted!",
      icon: "warning",
      confirmText: "Yes, delete it!",
      cancelText: "No, cancel",
      confirmColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      // Step 1: Delete all comments related to each task
      if (tasks?.length) {
        for (const task of tasks) {
          if (task.comments && task.comments.length) {
            for (const commentId of task.comments) {
              try {
                await deleteComment(commentId).unwrap();
              } catch (err) {
                console.warn(`Failed to delete comment ${commentId}`, err);
              }
            }
          }
        }

        // Step 2: Delete all tasks in this project
        for (const task of tasks) {
          try {
            await deleteTask(task.id).unwrap();
          } catch (err) {
            console.warn(`Failed to delete task ${task.id}`, err);
          }
        }
      }

      // Step 3: Delete the project itself
      await deleteProject(project.id).unwrap();

      await showSuccess("Deleted!", "The project and all related data have been deleted.");
      window.location.href = "/";
    } catch (err) {
      await showError("Error", "Failed to fully delete project.");
      console.error("Delete project error:", err);
    }
  };

  if (loadingProject || loadingTasks) return (
    <div>
      <ProjectPageSkeleton />
    </div>
  );
  if (!project) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 dark:text-dark-text"
    >
      Project not found
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-dark-bg"
    >
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`
            flex-1 min-h-screen transition-all duration-300
            ${sidebarOpen ? "lg:ml-0" : "lg:ml-0"}
          `}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {/* HEADER - Desktop */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hidden lg:flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 lg:mb-10"
            >
              <div className="space-y-4 lg:space-y-6">
                <p className="text-sm text-gray-400 dark:text-dark-muted">
                  Projects / {project.name}
                </p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold dark:text-dark-text truncate">
                    {project.name}
                  </h1>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditModalOpen(true)}
                        className="group relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50 transition-all duration-200"
                        aria-label="Edit project details"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500 dark:text-dark-muted group-hover:text-gray-700 dark:group-hover:text-dark-text transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                          Edit project
                        </span>
                      </motion.button>

                      {/* Delete Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDeleteProject}
                        className="group relative p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                        aria-label="Delete project"
                      >
                        <svg
                          className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                          Delete project
                        </span>
                      </motion.button>
                    </div>
                  )}
                </div>
                {/* DETAILS - VERTICAL LAYOUT */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="space-y-4 text-sm text-gray-700 dark:text-dark-text"
                >
                  {/* DESCRIPTION */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("FileText", { className: "w-5 h-5" })}
                      <span>Description</span>
                    </div>
                    <p className="font-medium text-gray-700 dark:text-dark-text max-w-3xl">
                      {project.description || (
                        <span className="text-gray-400 dark:text-dark-muted italic">No description</span>
                      )}
                    </p>
                  </motion.div>

                  {/* VISIBILITY */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2 text-gray-500 dark:text Coach-dark-muted sm:min-w-[120px]">
                      {getLucideIcon(project.visibility === "private" ? "Lock" : "LockOpen", {
                        className: "w-5 h-5",
                      })}
                      <span>Visibility</span>
                    </div>
                    <span
                      className={`font-medium px-3 py-1 rounded-full border flex items-center gap-2 w-fit ${
                        project.visibility === "private"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border for-red-800"
                          : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      }`}
                    >
                      {getLucideIcon(project.visibility === "private" ? "Lock" : "LockOpen", {
                        className: "w-4 h-4",
                      })}
                      {project.visibility} Board
                    </span>
                  </motion.div>

                  {/* ASSIGNED TO */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("User", { className: "w-4 h-4" })}
                      <span>Assigned to</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* First 3 members with names */}
                        {project.members?.slice(0, 3).map((id, idx) => {
                          const member = allUsers?.find((u) => u.id === id);
                          if (!member) return null;
                          return (
                            <motion.div
                              key={id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 + idx * 0.05 }}
                              className="flex items-center gap-2 pr-2 bg-gray-100 dark:bg-dark-border rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text flex-shrink-0"
                            >
                              <Avatar name={member.name} avatar={member.avatar} size={35} />
                              <span className="text-sm font-medium whitespace-nowrap">{member.name}</span>
                            </motion.div>
                          );
                        })}

                        {/* Overlapping avatars (4th to 7th) */}
                        {project.members && project.members.length > 3 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex -space-x-2"
                          >
                            {project.members.slice(3, 7).map((id, idx) => {
                              const member = allUsers?.find((u) => u.id === id);
                              if (!member) return null;
                              return (
                                <motion.div
                                  key={id}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.65 + idx * 0.05 }}
                                  className="border-2 border-white dark:border-dark-surface rounded-full cursor-pointer hover:z-10 transition-all"
                                  onClick={() => openMembersModal(true)}
                                >
                                  <Avatar name={member.name} avatar={member.avatar} size={35} />
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}

                        {/* +X more */}
                        {project.members && project.members.length > 7 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8 }}
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium text-gray-600 dark:text-dark-text cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-card transition -ml-7"
                            onClick={() => openMembersModal(true)}
                          >
                            +{project.members.length - 7}
                          </motion.div>
                        )}

                        {/* ADD MEMBERS BUTTON - ONLY FOR OWNER */}
                        {isOwner && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 }}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-card transition flex-shrink-0 ml-3"
                            onClick={() => openMembersModal(false)}
                          >
                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-600 text-xs border border-gray-300 dark:border-dark-surface">
                              +
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap">Add members</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* DEADLINE */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("Calendar", { className: "w-5 h-5" })}
                      <span>Deadline</span>
                    </div>
                    <span className="font-medium bg-gray-50 dark:bg-dark-border px-3 py-1 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text w-fit">
                      {new Date(project.deadline).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </motion.div>

                  {/* TAGS */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.95 }}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("Tag", { className: "w-5 h-5" })}
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex gap-2 flex-wrap">
                        {project.tags &&
                          project.tags.map((tag, idx) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1 + idx * 0.05 }}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                            >
                              {tag}
                            </motion.span>
                          ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* MOBILE PROJECT INFO SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="lg:hidden mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark"
              >
                <button
                  onClick={() => setProjectInfoOpen(!projectInfoOpen)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getLucideIcon("LayoutGrid", { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-dark-text truncate">{project.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-muted">Project details</p>
                  </div>
                </button>
                
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditModalOpen(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50 transition-all"
                      aria-label="Edit project"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setProjectInfoOpen(!projectInfoOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50 transition-all"
                    aria-label={projectInfoOpen ? "Collapse project info" : "Expand project info"}
                  >
                    <motion.div
                      animate={{ rotate: projectInfoOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {projectInfoOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                      )}
                    </motion.div>
                  </motion.button>
                </div>
              </motion.div>

              <AnimatePresence>
                {projectInfoOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark p-4 space-y-4 overflow-hidden"
                  >
                    <p className="text-xs text-gray-400 dark:text-dark-muted mb-2">
                      Projects / {project.name}
                    </p>

                    <div className="space-y-4 text-sm text-gray-700 dark:text-dark-text">
                      {/* Description */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3"
                      >
                        <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                          {getLucideIcon("FileText", { className: "w-5 h-5" })}
                          <span>Description</span>
                        </div>
                        <p className="font-medium text-gray-700 dark:text-dark-text max-w-3xl">
                          {project.description || (
                            <span className="text-gray-400 dark:text-dark-muted italic">No description</span>
                          )}
                        </p>
                      </motion.div>
                      {/* VISIBILITY */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                          {project.visibility === "private" ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                          <span>Visibility</span>
                        </div>
                        <span
                          className={`font-medium px-3 py-1 rounded-full border flex items-center gap-2 ${
                            project.visibility === "private"
                              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                          }`}
                        >
                          {project.visibility === "private" ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                          {project.visibility} Board
                        </span>
                      </motion.div>

                      {/* ASSIGNED TO */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                          <Users className="w-4 h-4" />
                          <span>Assigned to</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {project.members?.slice(0, 3).map((id, idx) => {
                            const member = allUsers?.find((u) => u.id === id);
                            if (!member) return null;
                            return (
                              <motion.div
                                key={id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + idx * 0.05 }}
                                className="flex items-center gap-2 pr-2 bg-gray-100 dark:bg-dark-border rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text text-xs flex-shrink-0"
                              >
                                <Avatar name={member.name} avatar={member.avatar} size={28} />
                                <span className="font-medium whitespace-nowrap">{member.name}</span>
                              </motion.div>
                            );
                          })}

                          {project.members && project.members.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="flex -space-x-2"
                            >
                              {project.members.slice(3, 7).map((id, idx) => {
                                const member = allUsers?.find((u) => u.id === id);
                                if (!member) return null;
                                return (
                                  <motion.div
                                    key={id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.35 + idx * 0.05 }}
                                    className="border-2 border-white dark:border-dark-surface rounded-full cursor-pointer"
                                    onClick={() => openMembersModal(true)}
                                  >
                                    <Avatar name={member.name} avatar={member.avatar} size={32} />
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          )}

                          {project.members && project.members.length > 7 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.45 }}
                              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium cursor-pointer -ml-6"
                              onClick={() => openMembersModal(true)}
                            >
                              +{project.members.length - 7}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* DEADLINE */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline</span>
                        </div>
                        <span className="font-medium bg-gray-50 dark:bg-dark-border px-3 py-1 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text text-xs">
                          {new Date(project.deadline).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </motion.div>

                      {/* TAGS */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.55 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                          <Tag className="w-4 h-4" />
                          <span>Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags &&
                            project.tags.map((tag, idx) => (
                              <motion.span
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + idx * 0.05 }}
                                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                              >
                                {tag}
                              </motion.span>
                            ))}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* VIEW TABS + ADD TASK BUTTON */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-3 gap-3 sm:gap-4"
            >
              {/* Tabs */}
              <div className="flex w-full text-sm overflow-x-auto">
                {[
                  { name: "Board", icon: LayoutGrid },
                  { name: "Table", icon: Table },
                  { name: "Timeline", icon: Clock },
                  { name: "List", icon: List },
                ].map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.name;

                  return (
                    <motion.div
                      key={tab.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + idx * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab(tab.name)}
                        className={`relative flex-1 justify-center p-3 sm:p-4 min-w-[80px]
                          ${
                            isActive
                              ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-blue-500"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">{tab.name}</span>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              {/* Add Task Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    variant={isMember ? "primary" : "outline"}
                    icon
                    onClick={() => isMember && dispatch(openTaskModal(null))}
                    disabled={!isMember}
                    className={`w-full sm:w-auto flex-shrink-0 transition-all ${
                      !isMember
                        ? "cursor-not-allowed opacity-60 hover:opacity-60"
                        : ""
                    }`}
                  >
                    {isMember ? (
                      "Add new task"
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Add new task
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Tooltip: You are not a member */}
                {!isMember && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="font-medium">You are not a member of this project</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Only project members can create tasks.
                    </p>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                  </div>
                )}

            </motion.div>

            {/* TAB CONTENT AREA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="border border-gray-200 dark:border-dark-border rounded-2xl p-4 bg-gray-50 dark:bg-dark-bg shadow-sm dark:shadow-card-dark"
            >
              {activeTab === "Board" && <BoardView projectId={project.id} />}
              {activeTab === "Timeline" && <TaskTimelineView />}
              {activeTab === "Table" && <TaskTableView projectId={project.id} />}
              {activeTab === "List" && <TaskListView projectId={project.id} />}

              {/* MODALS */}
              <AddMembersModal
                isOpen={addMembersModalOpen}
                onClose={() => {
                  setAddMembersModalOpen(false);
                  setViewOnlyMembers(false);
                }}
                currentMembers={project.members}
                onConfirm={handleUpdateMembers}
                viewOnly={viewOnlyMembers}
              />
              <AddTaskModal />
              <AddProjectModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                project={project}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}