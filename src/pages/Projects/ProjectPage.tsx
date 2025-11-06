import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { openTaskModal } from "../../store/slices/uiSlice";
import { useGetProjectByIdQuery, useUpdateProjectMutation } from "../../api/projects.api";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
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

export default function ProjectPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams<{ projectId: string }>();
  const sidebarOpen = useSelector((state: any) => state.ui.sidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Board");
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [viewOnlyMembers, setViewOnlyMembers] = useState(false);

  const { data: project, isLoading: loadingProject, refetch: refetchProject } = useGetProjectByIdQuery(projectId!);
  const { data: allUsers } = useGetAllUsersQuery();
  const { data: tasks, isLoading: loadingTasks, refetch } = useGetTasksByProjectQuery(projectId!);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updateProject] = useUpdateProjectMutation();

  // Current user from Redux (auth slice) or fallback to localStorage
  const currentUser = useAppSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id || localStorage.getItem("userId");

  // Owner check
  const isOwner = project?.ownerId === currentUserId;

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

  if (loadingProject || loadingTasks) return <div className="p-8 dark:text-dark-text">Loading...</div>;
  if (!project) return <div className="p-8 dark:text-dark-text">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div
          className={`
            flex-1 min-h-screen transition-all duration-300
            ${sidebarOpen ? "lg:ml-0" : "lg:ml-0"}
          `}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {/* HEADER - Desktop */}
            <div className="hidden lg:flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 lg:mb-10">
              <div className="space-y-4 lg:space-y-6">
                <p className="text-sm text-gray-400 dark:text-dark-muted">
                  Projects / {project.name}
                </p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold dark:text-dark-text truncate">
                    {project.name}
                  </h1>
                  {isOwner && (
                    <button
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
                      {/* Tooltip */}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                        Edit project
                      </span>
                    </button>
                  )}
                </div>
                {/* DETAILS - VERTICAL LAYOUT */}
                <div className="space-y-4 text-sm text-gray-700 dark:text-dark-text">
                  {/* DESCRIPTION */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("FileText", { className: "w-5 h-5" })}
                      <span>Description</span>
                    </div>
                    <p className="font-medium text-gray-700 dark:text-dark-text max-w-3xl">
                      {project.description || (
                        <span className="text-gray-400 dark:text-dark-muted italic">No description</span>
                      )}
                    </p>
                  </div>

                  {/* VISIBILITY */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon(project.visibility === "private" ? "Lock" : "LockOpen", {
                        className: "w-5 h-5",
                      })}
                      <span>Visibility</span>
                    </div>
                    <span
                      className={`font-medium px-3 py-1 rounded-full border flex items-center gap-2 w-fit ${
                        project.visibility === "private"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                          : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      }`}
                    >
                      {getLucideIcon(project.visibility === "private" ? "Lock" : "LockOpen", {
                        className: "w-4 h-4",
                      })}
                      {project.visibility} Board
                    </span>
                  </div>

                  {/* ASSIGNED TO */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("User", { className: "w-4 h-4" })}
                      <span>Assigned to</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* First 3 members with names */}
                        {project.members?.slice(0, 3).map((id) => {
                          const member = allUsers?.find((u) => u.id === id);
                          if (!member) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-2 pr-2 bg-gray-100 dark:bg-dark-border rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text flex-shrink-0"
                            >
                              <Avatar name={member.name} avatar={member.avatar} size={35} />
                              <span className="text-sm font-medium whitespace-nowrap">{member.name}</span>
                            </div>
                          );
                        })}

                        {/* Overlapping avatars (4th to 7th) */}
                        {project.members && project.members.length > 3 && (
                          <div className="flex -space-x-2">
                            {project.members.slice(3, 7).map((id) => {
                              const member = allUsers?.find((u) => u.id === id);
                              if (!member) return null;
                              return (
                                <div
                                  key={id}
                                  className="border-2 border-white dark:border-dark-surface rounded-full cursor-pointer hover:z-10 transition-all"
                                  onClick={() => openMembersModal(true)}
                                >
                                  <Avatar name={member.name} avatar={member.avatar} size={35} />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* +X more */}
                        {project.members && project.members.length > 7 && (
                          <div
                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium text-gray-600 dark:text-dark-text cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-card transition -ml-7"
                            onClick={() => openMembersModal(true)}
                          >
                            +{project.members.length - 7}
                          </div>
                        )}

                        {/* ADD MEMBERS BUTTON - ONLY FOR OWNER */}
                        {isOwner && (
                          <div
                            className="flex items-center gap-2 bg-gray-100 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-card transition flex-shrink-0 ml-3"
                            onClick={() => openMembersModal(false)}
                          >
                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-600 text-xs border border-gray-300 dark:border-dark-surface">
                              +
                            </div>
                            <span className="text-sm font-medium whitespace-nowrap">Add members</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DEADLINE */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
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
                  </div>

                  {/* TAGS */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {getLucideIcon("Tag", { className: "w-5 h-5" })}
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex gap-2 flex-wrap">
                        {project.tags &&
                          project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE PROJECT INFO SECTION */}
            <div className="lg:hidden mb-6">
              <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark">
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
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50 transition-all"
                      aria-label="Edit project"
                    >
                      <svg className="w-4 h-4 text-gray-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setProjectInfoOpen(!projectInfoOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card/50 transition-all"
                    aria-label={projectInfoOpen ? "Collapse project info" : "Expand project info"}
                  >
                    {projectInfoOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                    )}
                  </button>
                </div>
              </div>

              {projectInfoOpen && (
                <div className="mt-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark p-4 space-y-4">
                  <p className="text-xs text-gray-400 dark:text-dark-muted mb-2">
                    Projects / {project.name}
                  </p>

                  <div className="space-y-4 text-sm text-gray-700 dark:text-dark-text">
                    {/* VISIBILITY */}
                    <div className="flex items-center justify-between">
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
                    </div>

                    {/* ASSIGNED TO */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                        <Users className="w-4 h-4" />
                        <span>Assigned to</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {project.members?.slice(0, 3).map((id) => {
                          const member = allUsers?.find((u) => u.id === id);
                          if (!member) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-2 pr-2 bg-gray-100 dark:bg-dark-border rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text text-xs flex-shrink-0"
                            >
                              <Avatar name={member.name} avatar={member.avatar} size={28} />
                              <span className="font-medium whitespace-nowrap">{member.name}</span>
                            </div>
                          );
                        })}

                        {project.members && project.members.length > 3 && (
                          <div className="flex -space-x-2">
                            {project.members.slice(3, 7).map((id) => {
                              const member = allUsers?.find((u) => u.id === id);
                              if (!member) return null;
                              return (
                                <div
                                  key={id}
                                  className="border-2 border-white dark:border-dark-surface rounded-full cursor-pointer"
                                  onClick={() => openMembersModal(true)}
                                >
                                  <Avatar name={member.name} avatar={member.avatar} size={32} />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {project.members && project.members.length > 7 && (
                          <div
                            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium cursor-pointer -ml-6"
                            onClick={() => openMembersModal(true)}
                          >
                            +{project.members.length - 7}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DEADLINE */}
                    <div className="flex items-center justify-between">
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
                    </div>

                    {/* TAGS */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                        <Tag className="w-4 h-4" />
                        <span>Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.tags &&
                          project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* VIEW TABS + ADD TASK BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-3 gap-3 sm:gap-4">
              {/* Tabs */}
              <div className="flex w-full text-sm overflow-x-auto">
                {[
                  { name: "Board", icon: LayoutGrid },
                  { name: "Table", icon: Table },
                  { name: "Timeline", icon: Clock },
                  { name: "List", icon: List },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.name;

                  return (
                    <Button
                      key={tab.name}
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

                  );
                })}
              </div>
              <div style={{width: "60%"}}></div>
              {/* Add Task Button */}
              <Button
                variant="primary"
                icon
                onClick={() => dispatch(openTaskModal(null))}
                className="w-full sm:w-auto flex-shrink-0"
              >
                Add new task
              </Button>

            </div>

            {/* TAB CONTENT AREA */}
            <div className="border border-gray-200 dark:border-dark-border rounded-2xl p-4 bg-gray-50 dark:bg-dark-bg shadow-sm dark:shadow-card-dark">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}