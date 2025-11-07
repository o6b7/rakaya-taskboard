import React from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Table, Clock, List } from "lucide-react";
import { getLucideIcon } from "../../lib/getLucideIcon";

export default function ProjectPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-dark-bg"
    >
      <div className="flex">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 min-h-screen"
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {/* MOBILE: Collapsible Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:hidden mb-6"
            >
              <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <div className="h-6 w-40 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                      <div className="h-4 w-24 mt-1 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* DESKTOP/TABLET: Full Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="hidden lg:block mb-8"
            >
              <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="h-5 w-48 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />

                {/* Title + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-64 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
                    <div className="flex gap-2">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
                      <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                  {/* Description */}
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted min-w-[120px]">
                      {getLucideIcon("FileText", { className: "w-5 h-5" })}
                      <div className="h-4 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-full bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                      <div className="h-4 w-4/5 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted min-w-[120px]">
                      {getLucideIcon("Lock", { className: "w-5 h-5" })}
                      <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                  </div>

                  {/* Members */}
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted min-w-[120px]">
                      {getLucideIcon("Users", { className: "w-5 h-5" })}
                      <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                    <div className="flex -space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-border animate-pulse"
                        />
                      ))}
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center animate-pulse">
                        <span className="text-xs text-transparent">+X</span>
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted min-w-[120px]">
                      {getLucideIcon("Calendar", { className: "w-5 h-5" })}
                      <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                  </div>

                  {/* Tags */}
                  <div className="flex gap-3 items-start md:col-span-2">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted min-w-[120px]">
                      {getLucideIcon("Tag", { className: "w-5 h-5" })}
                      <div className="h-4 w-12 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-6 w-16 bg-gray-200 dark:bg-dark-border rounded-md animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* TABS + ADD TASK BUTTON */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3"
            >
              <div className="flex overflow-x-auto whitespace-nowrap">
                {[
                  { name: "Board", icon: LayoutGrid },
                  { name: "Table", icon: Table },
                  { name: "Timeline", icon: Clock },
                  { name: "List", icon: List },
                ].map((tab, idx) => (
                  <motion.div
                    key={tab.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + idx * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <div className="flex items-center gap-2 p-3 min-w-[80px] text-gray-500 animate-pulse">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">{tab.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="h-10 w-full sm:w-40 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
            </motion.div>

            {/* KANBAN BOARD - Responsive Columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="border border-gray-200 dark:border-dark-border rounded-2xl p-4 bg-gray-50 dark:bg-dark-bg shadow-sm overflow-hidden"
            >
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                {["Backlog", "To Do", "In Progress", "Need Review", "Done"].map((title, colIdx) => (
                  <div
                    key={title}
                    className="flex flex-col flex-shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] bg-white/50 dark:bg-dark-surface/50 rounded-2xl p-3"
                  >
                    {/* Column Header */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-md mb-4 bg-gray-100 dark:bg-dark-border animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-dark-muted animate-pulse" />
                      <div className="h-5 w-20 bg-gray-200 dark:bg-dark-muted rounded animate-pulse flex-1" />
                      <div className="h-6 w-8 bg-gray-200 dark:bg-dark-muted rounded-full animate-pulse ml-auto" />
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3 min-h-[200px]">
                      {colIdx < 3 ? (
                        [...Array(colIdx === 0 ? 2 : colIdx === 1 ? 3 : 1)].map((_, taskIdx) => (
                          <div
                            key={taskIdx}
                            className="p-4 bg-white dark:bg-dark-card rounded-md border border-gray-200 dark:border-dark-border space-y-3 animate-pulse"
                          >
                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-dark-border rounded" />
                            <div className="h-4 w-full bg-gray-200 dark:bg-dark-border rounded" />
                            <div className="h-4 w-5/6 bg-gray-200 dark:bg-dark-border rounded" />
                            <div className="flex justify-between items-center mt-3">
                              <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-7 h-7 rounded-full bg-gray-200 dark:bg-dark-border animate-pulse"
                                  />
                                ))}
                              </div>
                              <div className="flex gap-3">
                                <div className="h-5 w-10 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                                <div className="h-5 w-10 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-dark-muted">
                          <div className="h-10 w-10 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-2" />
                          <div className="h-4 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}