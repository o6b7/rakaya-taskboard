import { useState, useEffect, useRef } from "react";
import { toggleSidebar } from "../../store/slices/uiSlice";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "../../store";
import { setActiveProject, toggleNewProjectModal } from "../../store/slices/projectsSlice";
import { Button } from "../ui/Button";
import { AddProjectModal } from "../../components/Projects/AddProjectModal";

const PROJECTS_PER_PAGE = 5;

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { activeProject, isNewProjectModalOpen } = useAppSelector((state) => state.projects);
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const authUserId = authUser?.id;
  const [openProjects, setOpenProjects] = useState(true);

  const { data: projects = [], isLoading, error } = useGetProjectsQuery();

  const visibleProjects = projects.filter(
    (project) =>
      project.visibility === "public" ||
      project.members?.includes(authUserId) ||
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

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.id === projectId);
      if (found && (!activeProject || activeProject.id !== found.id)) {
        dispatch(setActiveProject(found));
      }
    }
  }, [projectId, projects, activeProject, dispatch]);

  // Helper to close sidebar on small screens
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 640) {
      dispatch(toggleSidebar());
    }
  };

  const handleSelectProject = (project: any) => {
    dispatch(setActiveProject(project));
    navigate(`/projects/${project.id}`);
    closeSidebarOnMobile();
  };

  const handleCloseModal = () => {
    dispatch(toggleNewProjectModal(false));
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 sm:hidden z-40"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Reusable AddProjectModal */}
      <AddProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={handleCloseModal}
      />

      <aside
        className={clsx(
          "fixed sm:sticky top-0 left-0 h-screen bg-white dark:bg-dark-surface border-r border-surface-border dark:border-dark-border flex flex-col justify-between p-3 z-50 transition-all duration-300 overflow-y-auto",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full sm:translate-x-0 sm:w-64"
        )}
      >
        <div className="flex-1 flex flex-col">
          {/* Logo */}
          <div
            onClick={() => {
              navigate("/");
              closeSidebarOnMobile();
            }}
            className="flex items-center gap-2 px-3 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card rounded-lg transition-colors mb-2 flex-shrink-0"
          >
            <img src="/vite.svg" alt="Logo" className="w-7 h-7" />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
              Sintask
            </h1>
          </div>

          {/* Navigation */}
          <div className="space-y-1 flex-1">
            {/* Home */}
            <button
              onClick={() => {
                navigate("/");
                closeSidebarOnMobile();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
            >
              {getLucideIcon("Home", { className: "w-5 h-5" })}
              <span className="font-medium">Home</span>
            </button>

            {/* Projects */}
            <div>
              <button
                onClick={() => setOpenProjects(!openProjects)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-3">
                  {getLucideIcon(openProjects ? "FolderOpen" : "Folder", { className: "w-5 h-5" })}
                  <span className="font-medium">Projects</span>
                </div>
                {getLucideIcon(openProjects ? "ChevronDown" : "ChevronRight", {
                  className: "w-4 h-4 text-gray-400 dark:text-dark-muted",
                })}
              </button>

              {openProjects && (
                <div className="ml-7 mt-1 border-l border-gray-200 dark:border-dark-border">
                  <button
                    onClick={() => {
                      dispatch(toggleNewProjectModal(true));
                      closeSidebarOnMobile(); 
                    }}
                    className="flex items-center gap-2 w-full pl-4 py-2.5 text-sm rounded-lg transition-colors text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-card/50 mb-2"
                  >
                    {getLucideIcon("Plus", { className: "w-4 h-4" })}
                    <span>Add Project</span>
                  </button>

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
                    <div
                      className={clsx(
                        "absolute top-0 left-0 right-0 h-6 pointer-events-none z-10 transition-opacity duration-300",
                        showTopShadow ? "opacity-100" : "opacity-0"
                      )}
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
                        visibleProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className={clsx(
                              "flex items-center gap-2 w-full pl-4 py-2.5 text-sm rounded-lg transition-colors",
                              activeProject?.id === project.id
                                ? "text-blue-600 dark:text-blue-300 font-semibold"
                                : "text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-card/50"
                            )}
                          >
                            {getLucideIcon(project.iconName || "Folder", { className: "w-4 h-4" })}
                            <span className="truncate">{project.name}</span>
                          </button>
                        ))
                      ) : (
                        !isLoading && (
                          <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                            No projects found
                          </div>
                        )
                      )}
                    </div>

                    <div
                      className={clsx(
                        "absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10 transition-opacity duration-300",
                        showBottomShadow ? "opacity-100" : "opacity-0"
                      )}
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)",
                        filter: "blur(1px)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calendar */}
            <button
              onClick={() => {
                navigate("/calendar");
                closeSidebarOnMobile();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
            >
              {getLucideIcon("Calendar", { className: "w-5 h-5" })}
              <span className="font-medium">Calendar</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                navigate("/settings");
                closeSidebarOnMobile();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
            >
              {getLucideIcon("Settings", { className: "w-5 h-5" })}
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-2xl p-4 shadow-card dark:shadow-card-dark text-center mt-4 flex-shrink-0">
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;