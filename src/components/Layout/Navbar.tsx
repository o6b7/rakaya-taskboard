import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleSidebar, toggleDarkMode } from "../../store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "../../store";
import { useGetTasksQuery } from "../../api/tasks.api";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import Avatar from "../Common/Avatar";
import { Button } from "../ui/Button";
import { getLucideIcon } from "../../lib/getLucideIcon";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);

  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [showTooltip, setShowTooltip] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userId = authUser?.id;
  const fallbackName = authUser?.name || "User";
  const fallbackEmail = authUser?.email || "user@example.com";
  const fallbackCreated = authUser?.createdAt || "2023-01-01T00:00:00Z";

  const { data: allUsers = [] } = useGetAllUsersQuery();
  const { data: allTasks = [] } = useGetTasksQuery();
  const { data: allProjects = [] } = useGetProjectsQuery();

  const userFromDb = useMemo(
    () => allUsers.find((u) => u.id === userId),
    [allUsers, userId]
  );

  const name = userFromDb?.name || fallbackName;
  const email = userFromDb?.email || fallbackEmail;
  const avatar = userFromDb?.avatar || authUser?.avatar || null;
  const createdAt = userFromDb?.createdAt || fallbackCreated;

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

  // ✅ Dark mode toggle effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ✅ Close profile/notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setOpenProfile(false);
        setOpenNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dummy notifications
  const notifications = [
    { id: 1, text: "New comment on 'Project Alpha'", time: "2m ago" },
    { id: 2, text: "Task 'UI Review' assigned to you", time: "10m ago" },
    { id: 3, text: "Project Beta deadline tomorrow", time: "1h ago" },
    { id: 4, text: "New file uploaded to Project Gamma", time: "3h ago" },
    { id: 5, text: "You were mentioned in a comment", time: "5h ago" },
    { id: 6, text: "New member joined Project Delta", time: "8h ago" },
    { id: 7, text: "Task 'Fix bugs' moved to In Progress", time: "1d ago" },
    { id: 8, text: "Weekly summary ready for review", time: "2d ago" },
    { id: 9, text: "Meeting scheduled for Monday", time: "3d ago" },
  ];

  const handleViewMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, notifications.length));
  };

  return (
    <nav className="relative flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-dark-surface border-b border-surface-border dark:border-dark-border transition-colors duration-300">
      {/* Left */}
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

      {/* Right */}
      <div className="flex items-center gap-4 ml-6 relative">
        {/* Dark Mode */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition"
        >
          {darkMode
            ? getLucideIcon("Sun", { className: "w-5 h-5 text-yellow-400" })
            : getLucideIcon("Moon", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })}
        </button>

        {/* 📧 Mail with Tooltip */}
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
            {getLucideIcon("Mail", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })}
          </button>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="absolute left-1/2 -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap"
              >
                💬 Chatting will come soon
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 🔔 Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setOpenNotifications((prev) => !prev);
              setOpenProfile(false);
            }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition"
          >
            {getLucideIcon("Bell", { className: "w-5 h-5 text-gray-500 dark:text-dark-muted" })}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {openNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">
                    Notifications
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, visibleCount).map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-surface transition cursor-pointer border-b border-gray-100 dark:border-dark-border"
                    >
                      <div className="text-sm text-gray-800 dark:text-dark-text">{n.text}</div>
                      <div className="text-xs text-gray-500 mt-1">{n.time}</div>
                    </motion.div>
                  ))}

                  {visibleCount < notifications.length && (
                    <div className="text-center py-3">
                      <button
                        onClick={handleViewMore}
                        className="text-primary-600 text-sm font-medium hover:underline"
                      >
                        View more
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 👤 Profile */}
        <div
          ref={profileRef}
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => {
            setOpenProfile((prev) => !prev);
            setOpenNotifications(false);
          }}
        >
          <Avatar name={name} avatar={avatar} size={36} />
          <span className="hidden sm:inline text-sm font-medium text-gray-800 dark:text-dark-text">
            {name}
          </span>
          {getLucideIcon("ChevronDown", {
            className: `w-4 h-4 text-gray-500 dark:text-dark-muted transition-transform duration-300 ${
              openProfile ? "rotate-180" : ""
            }`,
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
                <Avatar name={name} avatar={avatar} size={48} />
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
                  localStorage.removeItem("authToken");
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
