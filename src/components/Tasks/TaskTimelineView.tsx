import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Gantt, ViewMode, type Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useParams } from "react-router-dom";
import { useGetTasksByProjectQuery } from "../../api/tasks.api";
import { useAppSelector } from "../../store";
import { differenceInDays } from "date-fns";
import { Clock, Pin, Calendar, Loader2 } from "lucide-react";
import type { Task } from "../../types";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { motion } from "framer-motion";

const VIEW_MODES = [
  { mode: ViewMode.Day, label: "Day" },
  { mode: ViewMode.Week, label: "Week" },
  { mode: ViewMode.Month, label: "Month" },
] as const;

const PRIORITY = {
  High: { dot: "bg-red-500", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  Medium: { dot: "bg-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  Low: { dot: "bg-green-500", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
} as const;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

export default function TaskTimelineView() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks = [], isLoading, isError } = useGetTasksByProjectQuery(projectId!);
  const isDark = useAppSelector((state) => state.ui.darkMode);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const today = useMemo(() => new Date(), []);
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isSmallScreen = !isMediumScreen;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  }, [tasks]);

  /* ----------------------------- Gantt Mapping ----------------------------- */
  const ganttTasks = useMemo((): GanttTask[] => {
    return sortedTasks.map((task): GanttTask => {
      const start = new Date(task.createdAt);
      const end = new Date(task.deadline);
      const total = end.getTime() - start.getTime();
      const elapsed = today.getTime() - start.getTime();
      const progress = total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0;

      return {
        id: task.id,
        name: task.title,
        start,
        end,
        type: "task",
        progress: Math.round(progress),
        styles: {
          backgroundColor: isDark ? "#4f46e5" : "#6366f1",
          backgroundSelectedColor: isDark ? "#4338ca" : "#4f46e5",
          progressColor: isDark ? "#a5b4fc" : "#c7d2fe",
          progressSelectedColor: isDark ? "#c7d2fe" : "#a5b4fc",
          textColor: "#fff",
        },
        dependencies: [], 
        taskData: task,
      } as GanttTask & { taskData: Task }; 
    });
  }, [sortedTasks, isDark, today]);

  const totalDays = useMemo(() => {
    if (!tasks.length) return 0;
    const dates = tasks.flatMap((t) => [new Date(t.createdAt), new Date(t.deadline)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return differenceInDays(max, min) + 1;
  }, [tasks]);

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => new Date(t.deadline) > today).length;
  }, [tasks, today]);

  const computeColumnWidth = useCallback(() => {
    if (isLargeScreen) {
      return viewMode === ViewMode.Month ? 120 : viewMode === ViewMode.Week ? 90 : 50;
    }
    if (isMediumScreen) {
      return viewMode === ViewMode.Month ? 80 : viewMode === ViewMode.Week ? 70 : 40;
    }
    return 45;
  }, [viewMode, isLargeScreen, isMediumScreen]);

  const [colWidth, setColWidth] = useState(computeColumnWidth());
  useEffect(() => {
    setColWidth(computeColumnWidth());
  }, [computeColumnWidth]);

  const listCellWidth = isLargeScreen ? "600px" : "0px";

  useEffect(() => {
    const container = ganttContainerRef.current;
    if (!container || !isSmallScreen) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.style.cursor = "grabbing";
    };

    const handleMouseLeave = () => {
      isDown = false;
      container.style.cursor = "grab";
    };

    const handleMouseUp = () => {
      isDown = false;
      container.style.cursor = "grab";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isSmallScreen]);

  if (isError) return null;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm dark:shadow-card-dark">
        <div className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ml-2">
      {/* Controls */}
      <div
        className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm dark:shadow-card-dark border dark:border-dark-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
          isSmallScreen ? "w-64" : "w-full"
        }`}
      >
        {/* View Mode Switch */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-dark-border p-1 shadow-sm w-full md:w-auto justify-center">
          {VIEW_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === mode
                  ? "bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text shadow-sm"
                  : "text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center md:justify-end gap-4 bg-gray-100 p-3 rounded-md text-sm text-gray-600 dark:text-dark-muted dark:bg-da w-full md:w-auto">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            {tasks.length} tasks
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            {activeTasks} active
          </span>
        </div>
      </div>

      {/* Gantt Chart */}
      <section className={isSmallScreen ? "w-64" : "w-full"}>
        <div
          ref={ganttContainerRef}
          className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm dark:shadow-card-dark border border-gray-200 dark:border-dark-border overflow-hidden"
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            cursor: isSmallScreen ? "grab" : "default",
          }}
        >
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center dark:text-white"
            >
              <div className="mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-5 dark:from-gray-800 dark:to-gray-900">
                {getLucideIcon("ClipboardList", { className: "h-12 w-12 text-gray-400 dark:text-gray-600" })}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">No tasks found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new task.</p>
            </motion.div>
          ) : (
            <Gantt
              key={`${viewMode}-${colWidth}-${isSmallScreen}`}
              tasks={ganttTasks}
              viewMode={viewMode}
              columnWidth={colWidth}
              listCellWidth={listCellWidth}
              barCornerRadius={10}
              barHeight={36}
              rowHeight={64}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="13px"
              todayColor="#f59e0b"
              arrowColor={isDark ? "#818cf8" : "#6366f1"}
              styles={{
                gridBackground: isDark ? "#121417" : "#ffffff",
                gridLineColor: isDark ? "#2a2e33" : "#e5e7eb",
                rowBackgroundColor: isDark ? "#1a1d21" : "#ffffff",
                rowAlternateBackgroundColor: isDark ? "#202327" : "#f9fafb",
              }}
              /* ------------------ ONLY LARGE SCREENS ------------------ */
              TaskListHeader={() =>
                isLargeScreen ? (
                  <div className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 dark:text-dark-text border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="w-2/4">Title</div>
                    <div className="w-1/4 text-center">From</div>
                    <div className="w-1/4 text-center">To</div>
                  </div>
                ) : null
              }
              TaskListTable={({ tasks, rowHeight }) =>
                isLargeScreen ? (
                  <div className="border-r border-gray-200 dark:border-dark-border">
                    {tasks.map((task: any) => {
                      const t = task.taskData;
                      const p = PRIORITY[t.priority as keyof typeof PRIORITY] || PRIORITY.Medium;
                      const from = new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const to = new Date(t.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 px-4 border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card transition-colors duration-150 text-xs"
                          style={{ height: rowHeight }}
                        >
                          <div className="w-96 flex items-center gap-2 truncate" title={task.name}>
                            <div className="w-5 flex justify-center text-yellow-500">
                              {t.pinned && <Pin className="w-3.5 h-3.5 rotate-45" />}
                            </div>

                            {/* Priority Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${p.bg} ${p.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                            </span>

                            {/* Task Title */}
                            <span className="font-medium text-gray-800 dark:text-dark-text truncate">{task.name}</span>
                          </div>

                          {/* From Date */}
                          <div className="w-1/4 pr-5 text-gray-500 dark:text-dark-muted">{from}</div>

                          {/* To Date */}
                          <div className="w-1/4 pl-5 text-gray-500 dark:text-dark-muted">{to}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null
              }
            />
          )}
        </div>
      </section>

      {/* Footer */}
      {tasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 dark:text-dark-muted">
          <span>
            Project span: <strong>{totalDays} days</strong>
          </span>
          <span className="flex items-center gap-2 mt-2 sm:mt-0">
            Timeline view <div className="w-2 h-2 rounded-full bg-blue-500" />
          </span>
        </div>
      )}
    </div>
  );
}