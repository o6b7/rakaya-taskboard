import { useState, useEffect, useRef } from "react";
import { toggleSidebar, setSidebarOpen } from "../../store/slices/uiSlice"; // ← Import setSidebarOpen
import { getLucideIcon } from "../../lib/getLucideIcon";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "../../store";
import { setActiveProject, toggleNewProjectModal } from "../../store/slices/projectsSlice";
import { Button } from "../ui/Button";
import { AddProjectModal } from "../../components/Projects/AddProjectModal";
import { motion, AnimatePresence } from "framer-motion";

const PROJECTS_PER_PAGE = 5;

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();

  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { activeProject, isNewProjectModalOpen } = useAppSelector((state) => state.projects);
  const authUser = useAppSelector((state) => state.auth.user);
  const isOwner = authUser?.role === "owner";
  const authUserId = authUser?.id;
  const [openProjects, setOpenProjects] = useState(true);

  const { data: projects = [], isLoading, error } = useGetProjectsQuery();

  const visibleProjects = projects.filter(
    (project) =>
      project.visibility === "public" ||
      project.members?.includes(authUserId as string) ||
      project.ownerId === authUserId
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const updateShadows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowTopShadow(scrollTop > 5);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
  };

  const handleScroll = () => updateShadows();

  useEffect(() => {
    if (visibleProjects.length > PROJECTS_PER_PAGE) {
      setShowBottomShadow(true);
    } else {
      setShowBottomShadow(false);
      setShowTopShadow(false);
    }
  }, [visibleProjects.length]);

  // === Sync activeProject with URL & route ===
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.id === projectId);
      if (found && (!activeProject || activeProject.id !== found.id)) {
        dispatch(setActiveProject(found));
      }
    } else {
      if (activeProject) {
        dispatch(setActiveProject(null));
      }
    }
  }, [projectId, projects, activeProject, dispatch]);

  // === NEW: Auto-open sidebar on large screens (≥640px) ===
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        dispatch(setSidebarOpen(true)); // Always open on desktop
      }
    };

    // Run on mount
    handleResize();

    // Listen to resize
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  // === Close sidebar only on mobile ===
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 640) {
      dispatch(setSidebarOpen(false));
    }
  };

  const handleSelectProject = (project: any) => {
    dispatch(setActiveProject(project));
    navigate(`/projects/${project.id}`);
    closeSidebarOnMobile();
  };

  const handleNavigate = (path: string) => {
    if (activeProject) {
      dispatch(setActiveProject(null));
    }
    navigate(path);
    closeSidebarOnMobile();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleCloseModal = () => {
    dispatch(toggleNewProjectModal(false));
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 sm:hidden z-40"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Reusable AddProjectModal */}
      <AddProjectModal isOpen={isNewProjectModalOpen} onClose={handleCloseModal} />

      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={clsx(
          "fixed sm:sticky top-0 left-0 h-screen bg-white dark:bg-dark-surface border-r border-surface-border dark:border-dark-border flex flex-col justify-between p-3 z-50 overflow-y-auto",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full sm:translate-x-0 sm:w-64"
        )}
      >
        <div className="flex-1 flex flex-col">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-2 px-3 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card rounded-lg transition-colors mb-2 flex-shrink-0"
          >
            <img src="/vite.svg" alt="Logo" className="w-7 h-7" />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
              Sintask
            </h1>
          </motion.div>

          {/* Navigation */}
          <div className="space-y-1 flex-1">
            {/* Home */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate("/")}
              className={clsx(
                "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors",
                isActiveRoute("/")
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300 font-semibold"
                  : "text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {getLucideIcon("Home", { className: "w-5 h-5" })}
              <span className="font-medium">Home</span>
            </motion.button>

            {/* Projects */}
            <div>
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenProjects(!openProjects)}
                className={clsx(
                  "flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-colors",
                  openProjects
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white",
                  "hover:bg-gray-100 dark:hover:bg-dark-card"
                )}
              >
                <div className="flex items-center gap-3">
                  {getLucideIcon(openProjects ? "FolderOpen" : "Folder", { className: "w-5 h-5" })}
                  <span className="font-medium">Projects</span>
                </div>
                <motion.div
                  animate={{ rotate: openProjects ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  {getLucideIcon("ChevronDown", {
                    className: "w-4 h-4 text-gray-400 dark:text-dark-muted",
                  })}
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openProjects && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-7 mt-1 border-l border-gray-200 dark:border-dark-border overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        dispatch(toggleNewProjectModal(true));
                        closeSidebarOnMobile();
                      }}
                      className="flex items-center gap-2 w-full pl-4 py-2.5 text-sm rounded-lg transition-colors text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-card/50 mb-2"
                    >
                      {getLucideIcon("Plus", { className: "w-4 h-4" })}
                      <span>Add Project</span>
                    </motion.button>

                    {isLoading && (
                      <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                        Loading projects...
                      </div>
                    )}

                    {error && (
                      <div className="pl-4 py-2.5 text-sm text-red-500 dark:text-red-400">
                        Error loading projects
                      </div>
                    )}

                    <div className="relative">
                      <motion.div
                        animate={{ opacity: showTopShadow ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
                        style={{
                          background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 100%)",
                          filter: "blur(1px)",
                        }}
                      />

                      <div
                        ref={scrollContainerRef}
                        className="max-h-[240px] overflow-y-auto pr-2 scroll-smooth"
                        onScroll={handleScroll}
                      >
                        {visibleProjects.length > 0 ? (
                          visibleProjects.map((project, index) => (
                            <motion.button
                              key={project.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSelectProject(project)}
                              className={clsx(
                                "flex items-center gap-2 w-full pl-4 py-2.5 text-sm rounded-lg transition-colors",
                                activeProject?.id === project.id
                                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300 font-semibold"
                                  : "text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-card/50"
                              )}
                            >
                              {getLucideIcon(project.iconName || "Folder", { className: "w-4 h-4" })}
                              <span className="truncate">{project.name}</span>
                            </motion.button>
                          ))
                        ) : (
                          !isLoading && (
                            <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                              No projects found
                            </div>
                          )
                        )}
                      </div>

                      <motion.div
                        animate={{ opacity: showBottomShadow ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)",
                          filter: "blur(1px)",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Users – ONLY SHOW IF OWNER */}
            {isOwner && (
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate("/users")}
                className={clsx(
                  "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors",
                  isActiveRoute("/users")
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300 font-semibold"
                    : "text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {getLucideIcon("Users", { className: "w-5 h-5" })}
                <span className="font-medium">Users</span>
              </motion.button>
            )}

            {/* Calendar */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate("/calendar")}
              className={clsx(
                "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors",
                isActiveRoute("/calendar")
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300 font-semibold"
                  : "text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {getLucideIcon("Calendar", { className: "w-5 h-5" })}
              <span className="font-medium">Calendar</span>
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate("/settings")}
              className={clsx(
                "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors",
                isActiveRoute("/settings")
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300 font-semibold"
                  : "text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {getLucideIcon("Settings", { className: "w-5 h-5" })}
              <span className="font-medium">Settings</span>
            </motion.button>
          </div>
        </div>

        {/* Bottom Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-2xl p-4 shadow-card dark:shadow-card-dark text-center mt-4 flex-shrink-0"
        >
          <div className="flex justify-center mb-2">
            {getLucideIcon("Rocket", { className: "w-6 h-6 text-primary-500" })}
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-dark-text">
            Become Pro
          </p>
          <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
            Upgrade for premium features
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={closeSidebarOnMobile}
          >
            Manage your plan
          </Button>
        </motion.div>
      </motion.aside>
    </>
  );
};

export default Sidebar;