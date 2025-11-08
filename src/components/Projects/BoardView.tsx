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
  } = useGetTasksByProjectQuery(projectId);
  const [updateTask] = useUpdateTaskMutation();

  // Optimistic drag state management
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingFromColumn, setDraggingFromColumn] = useState<ColumnType | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, ColumnType>>({});

  // Use only API tasks
  const baseTasks = apiTasks || [];

  // Merge optimistic updates with base tasks
  const tasks = useMemo(() => {
    if (Object.keys(optimisticUpdates).length === 0) {
      return baseTasks;
    }
    
    return baseTasks.map(task => {
      if (optimisticUpdates[task.id]) {
        return { ...task, column: optimisticUpdates[task.id] };
      }
      return task;
    });
  }, [baseTasks, optimisticUpdates]);

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
      const taskToMove = baseTasks.find((t) => t.id === taskId);
      if (!taskToMove) return;

      const originalColumn = taskToMove.column;

      // Immediate optimistic update
      setOptimisticUpdates(prev => ({
        ...prev,
        [taskId]: newColumn
      }));

      try {
        // Update without refetch - let RTK Query handle cache updates
        await updateTask({ 
          id: taskId, 
          updates: { column: newColumn } 
        }).unwrap();
        
        // Success: keep the optimistic update until the next data fetch
        // The cache update will eventually sync with our optimistic state
        
      } catch (err) {
        console.error("Failed to move task:", err);
        // Error: revert the optimistic update after a small delay for better UX
        setTimeout(() => {
          setOptimisticUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[taskId];
            return newUpdates;
          });
        }, 300);
      }
    },
    [updateTask, baseTasks]
  );

  // Drag event handlers
  const onDragStart = useCallback((taskId: string, fromColumn: ColumnType) => {
    setDraggingTaskId(taskId);
    setDraggingFromColumn(fromColumn);
  }, []);

  const onDragEnd = useCallback(() => {
    // Only clear dragging states, keep optimistic updates
    setDraggingTaskId(null);
    setDraggingFromColumn(null);
  }, []);

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
        {/* Full width board container */}
        <section className="w-full overflow-x-auto">
          <div className="flex flex-wrap lg:flex-nowrap gap-4 pb-6 w-full px-4 mt-3 justify-center">
            {COLUMN_DEFS.map((col) => {
              const colTasks = (
                col.key === "needreview"
                  ? tasks.filter((t) => t.column === "needreview" || t.column === "done")
                  : tasks.filter((t) => t.column === col.key)
              ).sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
              
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
        {tasks.length === 0 && (
          <div className="mt-4 text-sm text-gray-500 dark:text-dark-muted text-center">
            No tasks found for this project.
          </div>
        )}
      </div>
    </DndProvider>
  );
}