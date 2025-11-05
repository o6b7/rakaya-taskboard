import React from "react";
import { useDrop } from "react-dnd";
import TaskCard from "../Tasks/TaskCard";
import type { Task, ColumnType } from "../../types";

interface ColumnProps {
  title: string;
  color: string;
  columnKey: ColumnType;
  tasks: Task[];
  onMoveTask: (taskId: string, newColumn: ColumnType) => void;
  draggingTaskId?: string | null;
  draggingFromColumn?: ColumnType | null;
  onTaskDragStart?: (taskId: string, fromColumn: ColumnType) => void;
  onTaskDragEnd?: () => void;
}

const columnHeaders: Record<ColumnType, { bg: string; color: string; hover: string }> = {
  backlog: { 
    bg: "bg-[#F3F5F7]", 
    color: "text-black",
    hover: "hover:bg-[#E8EBEE]"
  },
  todo: { 
    bg: "bg-[#D6F2FF]", 
    color: "text-[#007CF5]",
    hover: "hover:bg-[#C4E8FF]"
  },
  inprogress: { 
    bg: "bg-[#FFF1E1]", 
    color: "text-[#B66E12]",
    hover: "hover:bg-[#FFE8D1]"
  },
  needreview: { 
    bg: "bg-[#E3FDEB]", 
    color: "text-[#099848]",
    hover: "hover:bg-[#D4F8E0]"
  },
  done: { 
    bg: "bg-[#F3F5F7]", 
    color: "text-black",
    hover: "hover:bg-[#E8EBEE]"
  },
};

export default function Column({
  title,
  columnKey,
  tasks,
  onMoveTask,
  draggingTaskId,
  draggingFromColumn,
  onTaskDragStart,
  onTaskDragEnd,
}: ColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: "TASK",
      drop: (item: { id: string; from: ColumnType }) => {
        if (item.from !== columnKey) {
          onMoveTask(item.id, columnKey);
        }
        return { name: columnKey };
      },
      canDrop: (item: { id: string; from: ColumnType }) => {
        return item.from !== columnKey;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [onMoveTask, columnKey]
  );

  const headerStyle = columnHeaders[columnKey] || columnHeaders.backlog;
  const isActive = isOver && canDrop;

  return (
    <div
    ref={drop}
    className={`
        flex flex-col flex-1 min-w-[250px] max-w-[350px] 
        sm:min-w-[280px] sm:max-w-[400px]
        bg-white/50 dark:bg-dark-surface/50 rounded-2xl p-3
        transition-all duration-300 ease-out overflow-hidden
        ${isActive 
        ? "ring-2 ring-blue-400 ring-opacity-70 bg-blue-50/60 dark:bg-blue-900/20 transform scale-[1.02]" 
        : ""
        }
    `}
    aria-label={`${title} column with ${tasks.length} tasks`}
    >

      {/* Column Header */}
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 dark:opacity-90
          ${headerStyle.bg} ${headerStyle.color} ${headerStyle.hover} mb-4
          ${isActive ? "shadow-md" : "shadow-sm"}
        `}
      >
        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-current opacity-80" />
        </div>
        <h2 className="font-semibold text-sm uppercase tracking-wide truncate flex-1">
          {title}
        </h2>
        <div className="ml-auto text-xs font-medium bg-white/60 dark:bg-black/30 px-2 py-1 rounded-full min-w-8 text-center shadow-sm">
          {tasks.length}
        </div>
      </div>

      {/* Tasks Container */}
      <div
        className="space-y-3 overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{ 
          maxHeight: "calc(100vh - 200px)",
          minHeight: tasks.length === 0 ? "120px" : "auto"
        }}
      >
        {tasks.length === 0 && !draggingTaskId && (
          <div className="text-center py-8 text-gray-400 dark:text-dark-muted transition-all duration-300">
            <div className="mb-3 opacity-60">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1">No tasks yet</p>
            <p className="text-xs opacity-75">Drop tasks here</p>
          </div>
        )}

        {tasks.map((task) => {
          const isOriginAndDragging = draggingTaskId === task.id && draggingFromColumn === columnKey;

          if (isOriginAndDragging) {
            return (
              <div
                key={task.id}
                className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-800/30 h-28 flex items-center transition-all duration-300"
                aria-hidden
              >
                <div className="w-full animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-2/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-4/5" />
                </div>
              </div>
            );
          }

          return (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
            />
          );
        })}

        {/* Drop indicator for empty columns */}
        {isActive && tasks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/30 dark:bg-blue-900/20 p-4 h-20 flex items-center justify-center transition-all duration-300">
            <div className="text-blue-500 dark:text-blue-400 text-sm font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Drop here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}