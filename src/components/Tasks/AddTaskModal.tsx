import React, { useState, useEffect, useMemo } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

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

  const { data: projects = [] } = useGetProjectsQuery();
  const { data: allUsers = [] } = useGetAllUsersQuery();

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

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setAttachments(selectedTask.attachments || []);
      setPriority(selectedTask.priority || "Low");
      setColumn(selectedTask.column || "backlog");
      setProjectId(selectedTask.projectId || "");
      setAssigneeIds(selectedTask.assigneeIds || []);
      setDeadline(selectedTask.deadline.split("T")[0] || "");
    } else {
      resetFields();
      if (activeProject) {
        setProjectId(activeProject.id);
      }
    }
  }, [selectedTask, activeProject, taskModalOpen]);

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

  // Get selected project
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  // Filter users: only project members + creator (optional)
  const projectMembers = useMemo(() => {
    if (!selectedProject?.members) return [];
    return allUsers.filter((user) => selectedProject.members.includes(user.id));
  }, [selectedProject, allUsers]);

  // Filter users by search
  const filteredMembers = useMemo(() => {
    return projectMembers.filter((u) =>
      [u.name, u.id].some((field) =>
        field?.toLowerCase().includes(userSearch.toLowerCase())
      )
    );
  }, [projectMembers, userSearch]);

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      [p.name, p.id].some((field) =>
        field?.toLowerCase().includes(projectSearch.toLowerCase())
      )
    );
  }, [projects, projectSearch]);

  // Clear invalid assignees when project changes
  useEffect(() => {
    if (selectedProject?.members) {
      setAssigneeIds((prev) =>
        prev.filter((id) => selectedProject.members.includes(id))
      );
    } else {
      setAssigneeIds([]);
    }
  }, [selectedProject?.members]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const remainingSlots = 3 - attachments.length;
    if (remainingSlots <= 0) {
      return toast.error("Maximum 3 pictures allowed");
    }

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
        await updateTask({ id: selectedTask.id, updates: payload }).unwrap();
        showSuccess("Task updated successfully");
      } else {
        await createTask(payload).unwrap();
        showSuccess("Task added successfully");
        resetFields();
      }
      dispatch(closeTaskModal());
    } catch (err: any) {
      const message = err?.data?.message || "Failed to save task";
      showError(message);
    }
  };

  return (
    <AnimatePresence>
      {taskModalOpen && (
        <Dialog open={taskModalOpen} onOpenChange={() => dispatch(closeTaskModal())}>
          <DialogContent
            className="w-full max-w-lg h-[90vh] p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto"
            as={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <DialogHeader>
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {selectedTask ? "Edit Task" : "Add New Task"}
              </motion.h1>
            </DialogHeader>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="space-y-5"
            >
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Input
                  placeholder="Task title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Textarea
                  placeholder="Task description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 resize-none"
                />
              </motion.div>

              {/* Column & Priority */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center gap-2">
                  {getLucideIcon("LayoutList", { className: "w-5 h-5 text-gray-500" })}
                  <select
                    value={column}
                    onChange={(e) => setColumn(e.target.value as ColumnType)}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="needreview">Need Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {getLucideIcon("AlertCircle", { className: "w-5 h-5 text-gray-500" })}
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </motion.div>

              {/* Project Selection */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getLucideIcon("FolderKanban", { className: "w-5 h-5" })}
                    Project
                  </label>
                  {activeProject && !selectedTask && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Auto-selected
                    </span>
                  )}
                </div>

                <Input
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />

                <div className="max-h-44 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-1">
                  <AnimatePresence>
                    {filteredProjects.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-500 p-3 text-center"
                      >
                        No projects found
                      </motion.p>
                    ) : (
                      filteredProjects.map((proj, idx) => (
                        <motion.label
                          key={proj.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                            projectId === proj.id
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="project"
                            value={proj.id}
                            checked={projectId === proj.id}
                            onChange={() => setProjectId(proj.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="w-6 h-6 flex-shrink-0">
                            {proj.iconName
                              ? getLucideIcon(proj.iconName, { className: "w-5 h-5" })
                              : getLucideIcon("Folder", { className: "w-5 h-5" })}
                          </span>
                          <span className="text-sm truncate">{proj.name}</span>
                        </motion.label>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Deadline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getLucideIcon("Calendar", { className: "w-5 h-5" })}
                  Deadline *
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </motion.div>

              {/* Assignees - Only Project Members */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getLucideIcon("Users", { className: "w-5 h-5" })}
                    Assign Members
                  </label>
                  {projectMembers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {projectMembers.length} member{projectMembers.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <Input
                  placeholder={
                    projectMembers.length === 0
                      ? "No members in this project"
                      : "Search members..."
                  }
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  disabled={projectMembers.length === 0}
                />

                <div className="max-h-44 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-1">
                  <AnimatePresence>
                    {projectMembers.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-500 p-3 text-center"
                      >
                        No members in this project
                      </motion.p>
                    ) : filteredMembers.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-500 p-3 text-center"
                      >
                        No members found
                      </motion.p>
                    ) : (
                      filteredMembers.map((user, idx) => (
                        <motion.label
                          key={user.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        >
                          <input
                            type="checkbox"
                            checked={assigneeIds.includes(user.id)}
                            onChange={() => handleAssigneeToggle(user.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Avatar name={user.name} avatar={user.avatar} size={24} />
                          <span className="text-sm truncate">{user.name}</span>
                        </motion.label>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getLucideIcon("Paperclip", { className: "w-5 h-5" })}
                  Attachments (Max 3)
                </label>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/30"
                  onClick={() => document.getElementById("task-image-input")?.click()}
                >
                  <p className="text-sm text-gray-500 text-center">
                    Click to upload images
                  </p>
                  <Input
                    id="task-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </motion.div>

                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-3 gap-2"
                    >
                      {attachments.map((src, i) => (
                        <motion.div
                          key={i}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group"
                        >
                          <img
                            src={src}
                            alt="attachment"
                            className="w-full h-20 object-cover rounded-md border"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeAttachment(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            {getLucideIcon("X", { className: "w-3 h-3" })}
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex gap-3 pt-4 w-full"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    variant="outline"
                    onClick={() => dispatch(closeTaskModal())}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {selectedTask ? "Save Changes" : "Create Task"}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}