// src/pages/Calendar/CalendarPage.tsx
import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Folder,
  Loader2,
  StickyNote,
  ChevronDown,
  User,
} from "lucide-react";
import { useGetTasksQuery } from "../../api/tasks.api";
import { useGetProjectsQuery } from "../../api/projects.api";
import { useAppSelector } from "../../store";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all"); // "all" | "mine"

  // 🧩 Build filtered events
  const events = useMemo(() => {
    if (!tasks?.length) return [];

    let filtered = [...tasks];

    // ✅ Filter by project
    if (selectedProject !== "all") {
      filtered = filtered.filter((t) => t.projectId === selectedProject);
    }

    // ✅ Filter by user tasks
    if (selectedAssignee === "mine" && user?.id) {
      filtered = filtered.filter(
        (t) => t.creatorId === user.id || t.assigneeIds?.includes(user.id)
      );
    }

    // ✅ Convert to calendar events
    return filtered
      .filter((t) => t.deadline)
      .map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          date: t.deadline.split("T")[0],
          extendedProps: {
            projectName: project?.name || "Unknown Project",
            projectId: t.projectId,
            priority: t.priority,
            description: t.description || "No description provided",
          },
        };
      });
  }, [tasks, projects, selectedProject, selectedAssignee, user?.id]);

  // 🪣 Dropdown data
  const projectOptions = [
    { value: "all", label: "All Projects" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];
  const assigneeOptions = [
    { value: "all", label: "All Tasks" },
    { value: "mine", label: "My Tasks" },
  ];

  const handleEventClick = (info: any) => {
    const projectId = info.event.extendedProps.projectId;
    if (projectId) navigate(`/projects/${projectId}`);
  };

  const renderEventContent = (eventInfo: any) => {
    const { projectName, projectId, priority, description } = eventInfo.event.extendedProps;
    const dueDate = format(eventInfo.event.start, "MMM dd, yyyy");

    const priorityColor =
      priority === "High"
        ? "border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700"
        : priority === "Medium"
        ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-700"
        : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700";

    return (
      <div
        onClick={() => navigate(`/projects/${projectId}`)}
        className={`group border ${priorityColor} rounded-lg p-2 hover:shadow-md transition cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{eventInfo.event.title}</span>
          </div>
        </div>
        <div className="text-[11px] text-gray-600 dark:text-gray-300 truncate flex items-center gap-1">
          <Folder className="w-3 h-3" />
          {projectName}
        </div>
        <div className="text-[10px] text-gray-500">{dueDate}</div>
        {/* Tooltip */}
        <div className="absolute hidden group-hover:block bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg p-3 text-xs z-50">
          <div className="font-semibold">{eventInfo.event.title}</div>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    );
  };

  // 🕒 Loading
  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
              <CalendarIcon className="w-7 h-7 text-primary-600" />
              Task Calendar
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See all upcoming task deadlines in one view
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3">
            {/* My Tasks Filter */}
            <div className="relative">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {assigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Project Filter */}
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {projectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </motion.div>

        {/* CALENDAR */}
        {events.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-5"
          >
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              eventContent={renderEventContent}
              eventClick={handleEventClick}
              height="auto"
              dayMaxEvents={3}
            />
          </motion.div>
        ) : (
          // EMPTY STATE
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <CalendarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              No matching tasks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {selectedAssignee === "mine"
                ? "You have no tasks assigned or created with deadlines."
                : "No tasks with deadlines found for your selected filters."}
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => {
                setSelectedProject("all");
                setSelectedAssignee("all");
              }}
            >
              Reset Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
