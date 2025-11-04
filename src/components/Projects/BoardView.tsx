import React, { useState, useMemo, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import Column from "../ui/Column";
import type { Task, ColumnType } from "../../types";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskMutation,
} from "../../api/tasks.api";

// Column definitions
const COLUMN_DEFS: { key: ColumnType; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "#F6F6F6" },
  { key: "todo", label: "To Do", color: "#EAF3FF" },
  { key: "inprogress", label: "In Progress", color: "#FFF4E5" },
  { key: "needreview", label: "Need Review", color: "#E9F9EE" },
];

interface BoardViewProps {
  projectId: string;
}

export default function BoardView({ projectId }: BoardViewProps) {
  const {
    data: apiTasks = [],
    isLoading,
    isError,
    refetch,
  } = useGetTasksByProjectQuery(projectId);
  const [updateTask] = useUpdateTaskMutation();

  // Optimized drag state management
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromColumn, setDraggingFromColumn] =
    useState<ColumnType | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  // Use only API tasks - remove sample fallback
  const baseTasks = apiTasks || [];
  const tasks = optimisticTasks.length > 0 ? optimisticTasks : baseTasks;

  // Detect device type (mobile vs desktop)
  const isTouchDevice = useMemo(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)),
    []
  );

  // Pick backend dynamically
  const backend = isTouchDevice ? TouchBackend : HTML5Backend;
  const backendOptions = isTouchDevice
    ? { enableMouseEvents: true }
    : undefined;

  // Handle task move
  const handleMoveTask = useCallback(
    async (taskId: string, newColumn: ColumnType) => {
      const taskToMove = tasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      // Optimistic update for instant UI
      setOptimisticTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, column: newColumn } : task
        )
      );

      try {
        await updateTask({ id: taskId, updates: { column: newColumn } }).unwrap();
        refetch?.(); // Refresh data
      } catch (err) {
        console.error("Failed to move task:", err);
        setOptimisticTasks([]); // revert on error
      }
    },
    [updateTask, refetch, tasks]
  );

  // Drag event handlers
  const onDragStart = useCallback((taskId: string, fromColumn: ColumnType) => {
    setDraggingTaskId(taskId);
    setDraggingFromColumn(fromColumn);
  }, []);

  const onDragEnd = useCallback(() => {
    setTimeout(() => {
      setDraggingTaskId(null);
      setDraggingFromColumn(null);
      setOptimisticTasks([]);
    }, 100);
  }, []);

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
        {/* Full width board container */}
        <section className="w-full overflow-x-auto">
          <div className="flex flex-wrap lg:flex-nowrap gap-4 pb-6 w-full px-4 mt-3 justify-center">
            {COLUMN_DEFS.map((col) => {
              const colTasks =
              col.key === "needreview"
                ? tasks.filter((t) => t.column === "needreview" || t.column === "done")
                : tasks.filter((t) => t.column === col.key);

              return (
                <Column
                  key={col.key}
                  title={col.label}
                  color={col.color}
                  columnKey={col.key}
                  tasks={colTasks}
                  onMoveTask={handleMoveTask}
                  draggingTaskId={draggingTaskId}
                  draggingFromColumn={draggingFromColumn}
                  onTaskDragStart={onDragStart}
                  onTaskDragEnd={onDragEnd}
                />
              );
            })}
          </div>
        </section>

        {isLoading && (
          <div className="mt-4 text-sm text-gray-500 dark:text-dark-muted text-center">
            Loading tasks…
          </div>
        )}

        {isError && (
          <div className="mt-4 text-sm text-red-600 text-center">
            Failed to load tasks from API.
          </div>
        )}
      </div>
    </DndProvider>
  );
}
