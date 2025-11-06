import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeTaskModal } from "../../store/slices/uiSlice";
import type { RootState } from "../../store";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../api/tasks.api";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../ui/Dialog";
import type { Priority, ColumnType } from "../../types";
import { getLucideIcon } from "../../lib/getLucideIcon";
import Avatar from "../Common/Avatar";
import { showError, showSuccess } from "../../utils/sweetAlerts";

export default function AddTaskModal() {
  const dispatch = useDispatch();
  const { taskModalOpen, selectedTask } = useSelector(
    (state: RootState) => state.ui
  );
  const { activeProject } = useSelector((state: RootState) => state.projects);

  const { data: projects = [] } =
    useGetProjectsQuery();
  const { data: users = [] } = useGetAllUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [priority, setPriority] = useState<Priority>("Low");
  const [column, setColumn] = useState<ColumnType>("backlog");
  const [deadline, setDeadline] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const storedUser = localStorage.getItem("authUser");
  const authUser = storedUser ? JSON.parse(storedUser) : null;


  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  useEffect(() => {
    if (selectedTask) {
      // Edit mode: use the task's project
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setAttachments(selectedTask.attachments || []);
      setPriority(selectedTask.priority || "Low");
      setColumn(selectedTask.column || "backlog");
      setProjectId(selectedTask.projectId || "");
      setAssigneeIds(selectedTask.assigneeIds || []);
      setDeadline(selectedTask.deadline || "");
    } else {
      // Add mode: use active project if available
      resetFields();
      if (activeProject) {
        setProjectId(activeProject.id);
      }
    }
  }, [selectedTask, activeProject]);

  const resetFields = () => {
    setTitle("");
    setDescription("");
    setAttachments([]);
    setPriority("Low");
    setColumn("backlog");
    setProjectId(activeProject?.id || "");
    setAssigneeIds([]);
    setDeadline("");
    setUserSearch("");
    setProjectSearch("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const remainingSlots = 3 - attachments.length;
    if (remainingSlots <= 0) {
      return toast.error("Maximum 3 pictures allowed");
    }

    // Only take up to remaining slots from selected files
    const files = Array.from(e.target.files).slice(0, remainingSlots);

    const promises = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        })
    );

    const base64Files = await Promise.all(promises);
    setAttachments((prev) => [...prev, ...base64Files]);

    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAssigneeToggle = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return showError("Task title is required");
    if (!projectId) return showError("Please select a project");
    if (!deadline) return showError("Deadline is required");

    const now = new Date();
    const selectedDeadline = new Date(deadline);
    if (selectedDeadline < now) return showError("Deadline cannot be in the past");

    const payload = {
      title,
      description,
      attachments,
      priority,
      column,
      createdAt: new Date().toISOString(),
      deadline: new Date(deadline).toISOString(),
      projectId,
      assigneeIds,
      creatorId: authUser?.id,
    };

    try {
      if (selectedTask) {
        await updateTask({ ...selectedTask, ...payload }).unwrap();
        showSuccess("Task updated successfully 🎉");
      } else {
        await createTask(payload).unwrap();
        showSuccess("Task added successfully ✅");
        resetFields();
      }
      dispatch(closeTaskModal());
    } catch {
      showError("Failed to save task");
    }
  };


  if (!taskModalOpen) return null;

  // Filters
  const filteredUsers = users.filter((u) =>
    [u.name, u.id].some((field) =>
      field?.toLowerCase().includes(userSearch.toLowerCase())
    )
  );

  const filteredProjects = projects.filter((p) =>
    [p.name, p.id].some((field) =>
      field?.toLowerCase().includes(projectSearch.toLowerCase())
    )
  );

  return (
    <Dialog
      open={taskModalOpen}
      onOpenChange={() => dispatch(closeTaskModal())}
    >
      <DialogContent className="w-full max-w-lg h-[90vh] p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-xl overflow-auto">
        <DialogHeader>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedTask ? "Edit Task" : "Add New Task"}
          </h1>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {/* Title */}
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-medium border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-colors"
          />

          {/* Description */}
          <Textarea
            placeholder="Task description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-24 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-colors"
          />

          {/* Column & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              {getLucideIcon("LayoutList", { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value as ColumnType)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="needreview">Need Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {getLucideIcon("Tag", { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {getLucideIcon("FolderKanban", { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project</span>
              {activeProject && !selectedTask && (
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  Auto-selected from current project
                </span>
              )}
            </div>

            {/* Project Search */}
            <Input
              placeholder="Search project by name or ID..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-colors"
            />

            {/* Project List */}
            <div className="flex flex-col max-h-44 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50">
              {filteredProjects.length === 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-sm p-2">No projects found</span>
              )}
              {filteredProjects.map((proj) => (
                <label
                  key={proj.id}
                  className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-colors ${
                    projectId === proj.id 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="project"
                    value={proj.id}
                    checked={projectId === proj.id}
                    onChange={() => setProjectId(proj.id)}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  {/* Project icon */}
                  <span className="w-6 h-6 flex-shrink-0">
                    {proj.iconName 
                      ? getLucideIcon(proj.iconName, { className: "w-5 h-5 text-gray-700 dark:text-gray-300" }) 
                      : getLucideIcon("Folder", { className: "w-5 h-5 text-gray-700 dark:text-gray-300" })
                    }
                  </span>
                  <span className="text-sm truncate">{proj.name} ({proj.id})</span>
                </label>
              ))}
            </div>

          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
              {getLucideIcon("Calendar", { className: "w-5 h-5" })}  Deadline
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-colors"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Assignees */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {getLucideIcon("UserCircle2", { className: "w-5 h-5 text-gray-500 dark:text-gray-400" })}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign Users
              </span>
            </div>
            <Input
              placeholder="Search users by name or ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg transition-colors"
            />
            <div className="flex flex-col max-h-44 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50">
              {filteredUsers.length === 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-sm p-2">No users found</span>
              )}
              {filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(user.id)}
                    onChange={() => handleAssigneeToggle(user.id)}
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <Avatar
                    name={user.name}
                    avatar={user.avatar || undefined}
                    size={24}
                  />
                  <span className="text-sm truncate">{user.name} ({user.id})</span>
                </label>
              ))}

            </div>
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {getLucideIcon("Upload", { className: "w-5 h-5" })} Attach Pictures (Max 3)
            </label>

            {/* Upload Box */}
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-800/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onClick={() => document.getElementById("task-image-input")?.click()}
            >
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Click to upload or drag pictures here
              </p>
              <Input
                type="file"
                id="task-image-input"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Thumbnails */}
            {attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {attachments.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={file}
                      alt={`attachment-${i}`}
                      className="w-full h-20 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 m-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    >
                      {getLucideIcon("X", { className: "w-4 h-4" })}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => dispatch(closeTaskModal())}
              className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {selectedTask ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}