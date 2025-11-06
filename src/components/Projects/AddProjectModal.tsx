// src/components/Projects/ProjectFormModal.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { getLucideIcon } from "../../lib/getLucideIcon";
import * as Icons from "lucide-react";
import clsx from "clsx";
import { useCreateProjectMutation, useUpdateProjectMutation } from "../../api/projects.api";
import type { NewProject, Project } from "../../types";
import { showError, showSuccess } from "../../utils/sweetAlerts";

type AddProjectProps = {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
};

export const AddProjectModal: React.FC<AddProjectProps> = ({ isOpen, onClose, project }) => {
  const isEdit = !!project;
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const authUserId = authUser?.id;

  const [iconSearch, setIconSearch] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(project?.iconName ?? "Folder");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<Omit<NewProject, "ownerId" | "createdAt" | "members">>({
    name: project?.name ?? "",
    description: project?.description ?? "",
    iconName: project?.iconName ?? "Folder",
    deadline: project?.deadline ?? "",
    visibility: project?.visibility ?? "private",
    tags: project?.tags ?? [],
  });

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // sync selectedIcon ↔ form.iconName
  useEffect(() => {
    setForm((prev) => ({ ...prev, iconName: selectedIcon }));
  }, [selectedIcon]);

  // reset when modal closes or project changes
  useEffect(() => {
    if (!isOpen) return;
    if (project) {
      setForm({
        name: project.name,
        description: project.description ?? "",
        iconName: project.iconName,
        // Convert ISO to yyyy-MM-dd
        deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
        visibility: project.visibility,
        tags: project.tags ?? [],
      });
      setSelectedIcon(project.iconName);
    } else {
      setForm({
        name: "",
        description: "",
        iconName: "Folder",
        deadline: "",
        visibility: "private",
        tags: [],
      });
      setSelectedIcon("Folder");
    }
    setIconSearch("");
    setTagInput("");
  }, [isOpen, project]);

  const filteredIcons = Object.keys(Icons)
    .filter(
      (n) =>
        n.toLowerCase().includes(iconSearch.toLowerCase()) &&
        n !== "Icon" &&
        n !== "LucideIcon"
    )
    .slice(0, 12);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showError("Project name is required");
      return;
    }

    const payload = {
      ...form,
      ...(isEdit
        ? {}
        : {
            ownerId: authUserId,
            createdAt: new Date().toISOString(),
            members: [authUserId],
          }),
    };

    try {
      if (isEdit && project) {
        await updateProject({ id: project.id, updates: payload }).unwrap();
        showSuccess("Project updated successfully");
      } else {
        await createProject(payload as NewProject).unwrap();
        showSuccess("Project created successfully");
      }
      onClose();
    } catch (e) {
      console.error(e);
      showError("Failed to save project");
    }
  };


  return (
    <>
      {/* Backdrop with blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Modal */}
      <div 
        className={clsx(
          "fixed inset-0 flex items-center justify-center z-[70] transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
        onClick={handleBackdropClick}
      >
        <div 
          className="max-w-2xl w-full font-s max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg shadow-xl m-4"
          onClick={handleModalClick}
        >
          <div className="p-6 dark:text-white text-gray-900 font-s">
            <DialogHeader>
              <DialogTitle >
                {isEdit ? "Edit Project" : "Create New Project"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* ---- Name ---- */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Project Name *
                </label>
                <Input
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface"
                />
              </div>

              {/* ---- Description ---- */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your project..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface"
                />
              </div>

              {/* ---- Icon ---- */}
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
                      Click any icon below to change
                    </p>
                  </div>
                </div>

                <Input
                  placeholder="Search icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface"
                />

                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-dark-border rounded-lg">
                  {filteredIcons.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedIcon(name)}
                      className={clsx(
                        "flex items-center justify-center p-3 rounded-lg border transition-all hover:scale-105",
                        selectedIcon === name
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-blue-300 dark:hover:border-blue-600"
                      )}
                    >
                      {getLucideIcon(name, {
                        className: clsx(
                          "w-5 h-5 transition-colors",
                          selectedIcon === name ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-dark-text"
                        ),
                      })}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---- Deadline ---- */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface"
                />
              </div>

              {/* ---- Tags ---- */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface focus-within:ring-2 focus-within:ring-blue-400">
                  {form.tags?.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, tags: p.tags?.filter((_, idx) => idx !== i) }))
                        }
                        className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        {getLucideIcon("X", { className: "w-3 h-3" })}
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={form.tags?.length === 0 ? "Add tags (press Enter)" : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        setForm((p) => ({ ...p, tags: [...p.tags || "", tagInput.trim()] }));
                        setTagInput("");
                      } else if (e.key === "Backspace" && !tagInput && form.tags?.length) {
                        setForm((p) => ({ ...p, tags: p.tags?.slice(0, -1) }));
                      }
                    }}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted text-sm"
                  />
                </div>
              </div>

              {/* ---- Visibility ---- */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Visibility
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, visibility: e.target.value as "private" | "public" }))
                  }
                  className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* ---- Buttons ---- */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!form.name.trim()}
                  className="flex-1"
                >
                  {isEdit ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};