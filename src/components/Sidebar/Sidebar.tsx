import { useState } from "react";
import { getLucideIcon } from "../../utils/getLucideIcon";
import { useGetProjectsQuery } from "../../api/projects.api";

const Sidebar = () => {
  const [openProjects, setOpenProjects] = useState(true);
  const [openMembers, setOpenMembers] = useState(false);

  // Fetch projects using RTK Query
  const { data: projects = [], isLoading, error } = useGetProjectsQuery();

  return (
    <aside className="w-64 h-screen bg-surface dark:bg-dark-surface border-r border-surface-border dark:border-dark-border flex flex-col justify-between p-3">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4">
          <img src="/vite.svg" alt="Logo" className="w-7 h-7" />
          <h1 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Sintask</h1>
        </div>

        {/* Home */}
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
          {getLucideIcon("Home", { className: "w-5 h-5" })}
          <span>Home</span>
        </button>

        {/* Projects */}
        <button
          onClick={() => setOpenProjects(!openProjects)}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition"
        >
          <div className="flex items-center gap-3">
            {getLucideIcon(openProjects ? "FolderOpen" : "Folder", {
              className: "w-5 h-5",
            })}
            <span>Projects</span>
          </div>
          {getLucideIcon(openProjects ? "ChevronDown" : "ChevronRight", {
            className: "w-4 h-4",
          })}
        </button>

        {openProjects && (
          <div className="ml-7 mt-1 border-l border-gray-200 dark:border-dark-border">
            {/* Loading state */}
            {isLoading && (
              <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                Loading projects...
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="pl-4 py-2.5 text-sm text-red-500">
                Error loading projects
              </div>
            )}

            {/* Projects list */}
            {projects.map((project) => (
              <button
                key={project.id}
                className="flex items-center gap-2 pl-4 py-2.5 text-sm w-full text-gray-500 dark:text-dark-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-card rounded-lg"
              >
                {/* You might want to add an iconName field to your Project type */}
                {getLucideIcon(project.iconName || "Folder", { className: "w-4 h-4" })}
                <span>{project.name}</span>
              </button>
            ))}

            {/* Empty state */}
            {!isLoading && !error && projects.length === 0 && (
              <div className="pl-4 py-2.5 text-sm text-gray-500 dark:text-dark-muted">
                No projects found
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition mt-1">
          {getLucideIcon("Calendar", { className: "w-5 h-5" })}
          <span>Calendar</span>
        </button>

        {/* Members */}
        <button
          onClick={() => setOpenMembers(!openMembers)}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition mt-1"
        >
          <div className="flex items-center gap-3">
            {getLucideIcon("Users", { className: "w-5 h-5" })}
            <span>Members</span>
          </div>
          {getLucideIcon(openMembers ? "ChevronDown" : "ChevronRight", {
            className: "w-4 h-4",
          })}
        </button>

        {/* Settings */}
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition mt-1">
          {getLucideIcon("Settings", { className: "w-5 h-5" })}
          <span>Settings</span>
        </button>

        {/* Support */}
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition mt-1">
          {getLucideIcon("Info", { className: "w-5 h-5" })}
          <span>Support</span>
        </button>
      </div>

      {/* Bottom card */}
      <div className="bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-2xl p-4 shadow-card dark:shadow-card-dark text-center">
        <div className="flex justify-center mb-2">
          {getLucideIcon("Rocket", { className: "w-6 h-6 text-primary-500" })}
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-dark-text">
          Become Pro
        </p>
        <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
          Upgrade for premium features
        </p>
        <button className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition">
          Manage your plan
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;