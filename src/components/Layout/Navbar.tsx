"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleSidebar, toggleDarkMode } from "../../store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store";
import { useGetTasksQuery } from "../../api/tasks.api";
import { useGetProjectsQuery } from "../../api/projects.api";
import Avatar from "../Common/Avatar";
import { Button } from "../ui/Button";
import { getLucideIcon } from "../../lib/getLucideIcon";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);
  const [openProfile, setOpenProfile] = useState(false);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userId = authUser?.id || "U1";
  const name = authUser?.name || "Brandon Workman";
  const email = authUser?.email || "brandon.workman@example.com";
  const createdAt = authUser?.createdAt || "2023-06-12T09:00:00Z";

  const { data: allTasks = [] } = useGetTasksQuery();
  const { data: allProjects = [] } = useGetProjectsQuery();

  const userTasks = allTasks.filter((t) => t.assigneeIds?.includes(userId));
  
  const counts = {
    backlog: userTasks.filter((t) => t.column === "backlog").length,
    todo: userTasks.filter((t) => t.column === "todo").length,
    inprogress: userTasks.filter((t) => t.column === "inprogress").length,
    needreview: userTasks.filter((t) => t.column === "needreview").length,
    done: userTasks.filter((t) => t.column === "done").length,
  };

  const userProjects = allProjects.filter(
    (p) => p.ownerId === userId || p.members?.includes(userId)
  );

  const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <nav className="relative flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-dark-surface border-b border-surface-border dark:border-dark-border transition-colors duration-300">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1">
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition"
          onClick={() => dispatch(toggleSidebar())}
        >
          {getLucideIcon("Menu", { className: "w-5 h-5 text-gray-600 dark:text-gray-300" })}
        </button>

        <div className="flex items-center flex-1 max-w-2xl relative">
          {getLucideIcon("Search", { className: "absolute left-3 top-2.5 w-5 h-5 text-gray-400" })}
          <input
            type="text"
            placeholder="Search by name, label, task or team member..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-dark-text placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-6 relative">
        {/* Dark Mode */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition"
        >
          {darkMode ? (
            getLucideIcon("Sun", { className: "w-5 h-5 text-yellow-400" })
          ) : (
            getLucideIcon("Moon", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })
          )}
        </button>

        {/* Mail + Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
          {getLucideIcon("Mail", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
          {getLucideIcon("Bell", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setOpenProfile((prev) => !prev)}
        >
          <Avatar name={name} avatar={authUser.Avatar} size={36} />
          <span className="hidden sm:inline text-sm font-medium text-gray-800 dark:text-dark-text">
            {name}
          </span>
          {getLucideIcon("ChevronDown", {
            className: `w-4 h-4 text-gray-500 dark:text-dark-muted transition-transform duration-300 ${
              openProfile ? "rotate-180" : ""
            }`
          })}
        </div>

        {/* Profile Dropdown */}
        <AnimatePresence>
          {openProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="absolute right-0 top-12 w-72 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-4 z-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={name} avatar={authUser.Avatar} size={48} />
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-dark-text">{name}</h4>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">{email}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">
                    Member since {memberSince}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-dark-border my-2" />

              <div className="text-sm text-gray-700 dark:text-dark-text space-y-1">
                <div className="flex justify-between">
                  <span>Projects</span>
                  <span className="font-semibold">{userProjects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backlog</span>
                  <span>{counts.backlog}</span>
                </div>
                <div className="flex justify-between">
                  <span>To Do</span>
                  <span>{counts.todo}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress</span>
                  <span>{counts.inprogress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Need Review</span>
                  <span>{counts.needreview}</span>
                </div>
                <div className="flex justify-between">
                  <span>Done</span>
                  <span>{counts.done}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-dark-border my-3" />

              <Button
                variant="ghost"
                className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={() => {
                  localStorage.removeItem("authUser");
                  window.location.reload();
                }}
              >
                Logout
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;