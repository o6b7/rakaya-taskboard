import React from "react";
import { motion } from "framer-motion";
import { getLucideIcon } from "../../lib/getLucideIcon";

export default function CalendarPageSkeleton() {
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
            </div>
            <div className="mt-2 h-5 w-80 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3">
            {/* My Tasks */}
            <div className="relative">
              <div className="h-10 w-40 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-xl flex items-center px-10 animate-pulse">
                <div className="h-5 w-24 bg-gray-200 dark:bg-dark-border rounded" />
              </div>
              {getLucideIcon("User", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
              {getLucideIcon("ChevronDown", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
            </div>

            {/* Project */}
            <div className="relative">
              <div className="h-10 w-48 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-xl flex items-center px-10 animate-pulse">
                <div className="h-5 w-32 bg-gray-200 dark:bg-dark-border rounded" />
              </div>
              {getLucideIcon("Folder", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
              {getLucideIcon("ChevronDown", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
            </div>
          </div>
        </motion.div>

        {/* CALENDAR GRID SKELETON */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow p-5"
        >
          {/* Calendar Header (Prev/Title/Next) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
            </div>
            <div className="h-7 w-32 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-dark-muted py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => {
              const hasEvents = i % 7 === 2 || i % 7 === 4 || i === 15;
              const eventCount = hasEvents ? Math.floor(Math.random() * 3) + 1 : 0;

              return (
                <div
                  key={i}
                  className={`min-h-24 p-2 border border-gray-100 dark:border-dark-border rounded-lg ${
                    i >= 28 ? "opacity-50" : ""
                  }`}
                >
                  {/* Day Number */}
                  <div className="text-right text-xs text-gray-400 dark:text-dark-muted mb-1">
                    {i < 31 ? (
                      <div className="h-4 w-4 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    ) : null}
                  </div>

                  {/* Events */}
                  {hasEvents &&
                    [...Array(eventCount)].map((_, j) => (
                      <div
                        key={j}
                        className="mb-1 p-1.5 bg-gray-100 dark:bg-dark-card rounded animate-pulse"
                        style={{ animationDelay: `${j * 100}ms` }}
                      >
                        <div className="h-3 w-full bg-gray-200 dark:bg-dark-border rounded" />
                        <div className="h-2 w-16 bg-gray-200 dark:bg-dark-border rounded mt-1" />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* EMPTY STATE (optional) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 hidden"
        >
          <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center mb-6">
            {getLucideIcon("Calendar", { className: "w-10 h-10 text-gray-400 dark:text-dark-muted" })}
          </div>
          <div className="h-6 w-48 mx-auto bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-2" />
          <div className="h-5 w-80 mx-auto bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
          <div className="mt-6 h-10 w-32 mx-auto bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}