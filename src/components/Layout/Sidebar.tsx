import { useState, useEffect } from "react";
import { toggleSidebar } from "../../store/slices/uiSlice";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "../../store";
import { setActiveProject } from "../../store/slices/projectsSlice";
import { Button } from "../ui/Button";

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { activeProject } = useAppSelector((state) => state.projects);

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

  // Persist selected project in Redux
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.id === projectId);
      if (found && (!activeProject || activeProject.id !== found.id)) {
        dispatch(setActiveProject(found));
      }
    }
  }, [projectId, projects, activeProject, dispatch]);

  const handleSelectProject = (project: any) => {
    dispatch(setActiveProject(project));
    navigate(`/projects/${project.id}`);
    if (window.innerWidth < 640) dispatch(toggleSidebar());
  };

  const navItems = [
    { id: "home", label: "Home", icon: "Home", path: "/" },
    { id: "calendar", label: "Calendar", icon: "Calendar", path: "/calendar" },
    { id: "settings", label: "Settings", icon: "Settings", path: "/settings" },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 sm:hidden z-40"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={clsx(
          "fixed sm:sticky top-0 left-0 h-screen bg-white dark:bg-dark-surface border-r border-surface-border dark:border-dark-border flex flex-col justify-between p-3 z-50 transition-all duration-300 overflow-y-auto",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full sm:translate-x-0 sm:w-64"
        )}
      >
        <div className="flex-1 flex flex-col">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
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
                if (window.innerWidth < 640) dispatch(toggleSidebar());
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
                  {getLucideIcon(openProjects ? "FolderOpen" : "Folder", {
                    className: "w-5 h-5",
                  })}
                  <span className="font-medium">Projects</span>
                </div>
                {getLucideIcon(openProjects ? "ChevronDown" : "ChevronRight", {
                  className: "w-4 h-4 text-gray-400 dark:text-dark-muted",
                })}
              </button>

              {openProjects && (
                <div className="ml-7 mt-1 border-l border-gray-200 dark:border-dark-border">
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

                  {visibleProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project)}
                      className={clsx(
                        "flex items-center gap-2 w-full pl-4 py-2.5 text-sm rounded-lg transition-colors",
                        activeProject?.id === project.id
                          ? " text-blue-600 dark:text-blue-300 font-semibold"
                          : "text-gray-600 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-dark-card/50"
                      )}
                    >
                      {getLucideIcon(project.iconName || "Folder", {
                        className: "w-4 h-4",
                      })}
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}

                  {!isLoading && !error && visibleProjects.length === 0 && (
                    <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                      No projects found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
            {navItems.slice(1).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 640) dispatch(toggleSidebar());
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
              >
                {getLucideIcon(item.icon, { className: "w-5 h-5" })}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
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
          <Button variant="primary" className="w-full">
            Manage your plan
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
