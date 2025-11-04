"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { openTaskModal, toggleSidebar } from "../../store/slices/uiSlice";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import BoardView from "./BoardView";
import {
  Lock,
  LockOpen,
  Calendar,
  Tag,
  Users,
  LayoutGrid,
  Table,
  Clock,
  List,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/Button";

export default function ProjectPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams<{ projectId: string }>();
  const sidebarOpen = useSelector((state: any) => state.ui.sidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Board");

  const { data: project, isLoading: loadingProject } = useGetProjectByIdQuery(projectId!);
  const { data: tasks, isLoading: loadingTasks, refetch } = useGetTasksByProjectQuery(projectId!);

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
        <div className={`
          flex-1 min-h-screen transition-all duration-300
          ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
        `}>
          <div className="p-4 sm:p-6 lg:p-8">
            {/* HEADER - Desktop */}

              {/* ADD NEW TASK BUTTON */}
            <div className="hidden lg:flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 lg:mb-10">
              <div className="space-y-4 lg:space-y-6">
                <p className="text-sm text-gray-400 dark:text-dark-muted">
                  Projects / Design / {project.name}
                </p>

                <h1 className="text-2xl sm:text-3xl font-semibold dark:text-dark-text">{project.name}</h1>

                {/* DETAILS - VERTICAL LAYOUT */}
                <div className="space-y-4 text-sm text-gray-700 dark:text-dark-text">
                  {/* VISIBILITY */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      {project.visibility === "private" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <LockOpen className="w-4 h-4" />
                      )}
                      <span>Visibility</span>
                    </div>
                    <span className={`font-medium px-3 py-1 rounded-full border flex items-center gap-2 w-fit ${
                      project.visibility === "private" 
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" 
                        : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                    }`}>
                      {project.visibility === "private" ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <LockOpen className="w-3 h-3" />
                      )}
                      {project.visibility} Board
                    </span>
                  </div>

                  {/* ASSIGNED TO */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      <Users className="w-4 h-4" />
                      <span>Assigned to</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* First 3 users with names */}
                        {project.members?.slice(0, 3).map((member) => (
                          <div 
                            key={member} 
                            className="flex items-center gap-2 bg-gray-50 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text flex-shrink-0"
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${member}&background=random`}
                              className="w-5 h-5 rounded-full"
                              alt={member}
                            />
                            <span className="text-sm font-medium whitespace-nowrap">{member}</span>
                          </div>
                        ))}
                        
                        {/* Next 4 users as overlapping logos only */}
                        {project.members && project.members.length > 3 && (
                          <div className="flex -space-x-2">
                            {project.members.slice(3, 7).map((member, index) => (
                              <img
                                key={member}
                                src={`https://ui-avatars.com/api/?name=${member}&background=random`}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-surface"
                                alt={member}
                                style={{ zIndex: 4 - index }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* +X more indicator for remaining users */}
                        {project.members && project.members.length > 7 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium text-gray-600 dark:text-dark-text">
                            +{project.members.length - 7}
                          </div>
                        )}
                        
                        {/* Add another button */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-xs">
                            +
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">Add another</span>
                        </div>
                      </div>
                      
                      {/* "Add another for this task" link */}
                      <span className="text-blue-600 dark:text-blue-400 cursor-pointer text-sm hover:underline">
                        Add another for this task
                      </span>
                    </div>
                  </div>
                  {/* DEADLINE */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted sm:min-w-[120px]">
                      <Calendar className="w-4 h-4" />
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
                      <Tag className="w-4 h-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex gap-2 flex-wrap">
                        {project.tags && (
                          project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE PROJECT INFO SECTION */}
            <div className="lg:hidden mb-6">
              {/* Project Info Header - Collapsible */}
              <button
                onClick={() => setProjectInfoOpen(!projectInfoOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-gray-900 dark:text-dark-text">{project.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-muted">Project details</p>
                  </div>
                </div>
                {projectInfoOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                )}
              </button>

              {/* Collapsible Content */}
              {projectInfoOpen && (
                <div className="mt-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark p-4 space-y-4">
                  {/* Breadcrumb */}
                  <p className="text-xs text-gray-400 dark:text-dark-muted mb-2">
                    Projects / Design / {project.name}
                  </p>

                  {/* Project Details */}
                  <div className="space-y-4 text-sm text-gray-700 dark:text-dark-text">
                    {/* VISIBILITY */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                        {project.visibility === "private" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <LockOpen className="w-4 h-4" />
                        )}
                        <span>Visibility</span>
                      </div>
                      <span className={`font-medium px-3 py-1 rounded-full border flex items-center gap-2 ${
                        project.visibility === "private" 
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" 
                          : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                      }`}>
                        {project.visibility === "private" ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <LockOpen className="w-3 h-3" />
                        )}
                        {project.visibility} Board
                      </span>
                    </div>

                    {/* ASSIGNED TO - MOBILE */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                        <Users className="w-4 h-4" />
                        <span>Assigned to</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {/* First 3 users with names */}
                        {project.members?.slice(0, 3).map((member) => (
                          <div 
                            key={member} 
                            className="flex items-center gap-2 bg-gray-50 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text flex-shrink-0"
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${member}&background=random`}
                              className="w-5 h-5 rounded-full"
                              alt={member}
                            />
                            <span className="text-sm font-medium whitespace-nowrap">{member}</span>
                          </div>
                        ))}
                        
                        {/* Next 4 users as overlapping logos only */}
                        {project.members && project.members.length > 3 && (
                          <div className="flex -space-x-2">
                            {project.members.slice(3, 7).map((member, index) => (
                              <img
                                key={member}
                                src={`https://ui-avatars.com/api/?name=${member}&background=random`}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-surface"
                                alt={member}
                                style={{ zIndex: 4 - index }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* +X more indicator for remaining users */}
                        {project.members && project.members.length > 7 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-border border-2 border-white dark:border-dark-surface flex items-center justify-center text-xs font-medium text-gray-600 dark:text-dark-text">
                            +{project.members.length - 7}
                          </div>
                        )}
                        
                        {/* Add another button - mobile compact version */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-border px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-xs">
                            +
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">Add</span>
                        </div>
                      </div>
                      
                      <span className="text-blue-600 dark:text-blue-400 cursor-pointer text-sm block hover:underline">
                        Add another for this task
                      </span>
                    </div>
                    {/* DEADLINE */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline</span>
                      </div>
                      <span className="font-medium bg-gray-50 dark:bg-dark-border px-3 py-1 rounded-full border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text">
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
                        {project.tags && (
                          project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-md font-medium"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                      <button
                        onClick={() => dispatch(openTaskModal(null))}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 w-100 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        + Task
                      </button>
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
              {activeTab === "Board" && (
                <BoardView projectId={project.id} />
              )}

              {activeTab === "Timeline" && (
                <BoardView projectId={project.id} />
              )}

              {activeTab === "Table" && (
                <BoardView projectId={project.id} />
              )}

              {activeTab === "List" && (
                <BoardView projectId={project.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}