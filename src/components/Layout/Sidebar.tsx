import { useState, useEffect, useRef } from "react";
import { toggleSidebar } from "../../store/slices/uiSlice";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { useGetProjectsQuery, useCreateProjectMutation } from "../../api/projects.api";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "../../store";
import { setActiveProject, toggleNewProjectModal } from "../../store/slices/projectsSlice";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import * as Icons from "lucide-react";

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
  const [iconSearch, setIconSearch] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Folder");
  const [tagInput, setTagInput] = useState("");
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
    iconName: "Folder",
    deadline: "",
    visibility: "private",
    tags: [] as string[],
  });

  const { data: projects = [], isLoading, error } = useGetProjectsQuery();
  const [createProject] = useCreateProjectMutation();

  const visibleProjects = projects.filter(
    (project) =>
      project.visibility === "public" ||
      project.members?.includes(authUserId) ||
      project.ownerId === authUserId
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Update shadows on scroll
  const updateShadows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowTopShadow(scrollTop > 5);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
  };

  const handleScroll = () => {
    updateShadows();
  };

  // Initial shadow state when component mounts or projects change
  useEffect(() => {
    if (visibleProjects.length > PROJECTS_PER_PAGE) {
      setShowBottomShadow(true);
    } else {
      setShowBottomShadow(false);
      setShowTopShadow(false);
    }
  }, [visibleProjects.length]);

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

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...newProjectData,
        iconName: selectedIcon,
        ownerId: authUserId,
        createdAt: new Date().toISOString(),
        members: [authUserId], 
      };
      
      await createProject(projectData).unwrap();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleCloseModal = () => {
    dispatch(toggleNewProjectModal(false));
    setNewProjectData({
      name: "",
      description: "",
      iconName: "Folder",
      deadline: "",
      visibility: "private",
      tags: [],
    });
    setSelectedIcon("Folder");
    setIconSearch("");
  };

  // Filter icons based on search
  const filteredIcons = Object.keys(Icons)
    .filter(
      (iconName) =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase()) &&
        iconName !== "Icon" &&
        iconName !== "LucideIcon"
    )
    .slice(0, 12);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 sm:hidden z-40"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
      
      {/* Add Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-dark-bg dark:text-white">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Project Name *
              </label>
              <Input
                placeholder="Enter project name"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Description
              </label>
              <Textarea
                placeholder="Describe your project..."
                value={newProjectData.description}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Project Icon
              </label>
              
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg">
                  {getLucideIcon(selectedIcon, { className: "w-6 h-6 text-gray-600 dark:text-dark-text" })}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-dark-text">
                    Selected Icon: {selectedIcon}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">
                    Click on any icon below to change
                  </p>
                </div>
              </div>

              <Input
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />

              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-dark-border rounded-lg">
                {filteredIcons.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    className={clsx(
                      "flex items-center justify-center p-3 rounded-lg border transition-all duration-200 hover:scale-105",
                      selectedIcon === iconName
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    {getLucideIcon(iconName, { 
                      className: clsx(
                        "w-5 h-5 transition-colors",
                        selectedIcon === iconName 
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-dark-text"
                      )
                    })}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline - with white calendar icon */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Deadline
              </label>
              <Input
                type="date"
                value={newProjectData.deadline}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface focus-within:ring-2 focus-within:ring-blue-400">
                {newProjectData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setNewProjectData(prev => ({
                          ...prev,
                          tags: prev.tags.filter((_, i) => i !== index)
                        }));
                      }}
                      className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      {getLucideIcon("X", { className: "w-3 h-3" })}
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={newProjectData.tags.length === 0 ? "Add tags (press Enter)" : ""}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      setNewProjectData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tagInput.trim()]
                      }));
                      setTagInput("");
                    } else if (e.key === "Backspace" && !tagInput && newProjectData.tags.length > 0) {
                      setNewProjectData(prev => ({
                        ...prev,
                        tags: prev.tags.slice(0, -1)
                      }));
                    }
                  }}
                  className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted text-sm"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Visibility
              </label>
              <select
                value={newProjectData.visibility}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, visibility: e.target.value }))}
                className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button variant="ghost" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                disabled={!newProjectData.name.trim()}
                className="flex-1"
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    onClick={() => dispatch(toggleNewProjectModal(true))}
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
                    {/* Top shadow - improved with blur and fade */}
                    <div
                      className={clsx(
                        "absolute top-0 left-0 right-0 h-6 pointer-events-none z-10 transition-opacity duration-300",
                        showTopShadow
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                      style={{
                        background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 100%)",
                        filter: "blur(1px)",
                      }}
                    />

                    {/* Scroll container */}
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

                    {/* Bottom shadow - improved */}
                    <div
                      className={clsx(
                        "absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10 transition-opacity duration-300",
                        showBottomShadow
                          ? "opacity-100"
                          : "opacity-0"
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
            
            {/* Calendar & Settings */}
            <button
              onClick={() => {
                navigate("/calendar");
                if (window.innerWidth < 640) dispatch(toggleSidebar());
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-white"
            >
              {getLucideIcon("Calendar", { className: "w-5 h-5" })}
              <span className="font-medium">Calendar</span>
            </button>

            <button
              onClick={() => {
                navigate("/settings");
                if (window.innerWidth < 640) dispatch(toggleSidebar());
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
          <Button variant="primary" className="w-full">
            Manage your plan
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;