import React from "react";
import { motion } from "framer-motion";
import { getLucideIcon } from "../../lib/getLucideIcon";

export default function UsersPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="h-8 w-48 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
              <div className="mt-2 h-5 w-72 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              {getLucideIcon("Search", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
              <div className="h-10 w-full sm:w-80 bg-white dark:bg-dark-card border border-dark-border dark:border-dark-border rounded-lg pl-10 pr-4 flex items-center animate-pulse">
                <div className="h-5 w-48 bg-gray-200 dark:bg-dark-border rounded" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sm:hidden w-full mx-auto overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface border dark:border-dark-border"
        >
          <div className="min-w-[640px]">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                  {["User", "Status", "Role", "Joined", "Actions"].map((_, idx) => (
                    <motion.th
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + idx * 0.03 }}
                      className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-dark-muted uppercase tracking-wider text-left"
                    >
                      <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </motion.th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-dark-border">
                {[...Array(3)].map((_, rowIdx) => (
                  <motion.tr
                    key={rowIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + rowIdx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-dark-card"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                          <div className="h-3 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                          <div className="h-3 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <div className="h-6 w-16 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Desktop Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="hidden sm:block w-full overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface border dark:border-dark-border"
        >
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                {[
                  "User",
                  "Email",
                  "Status",
                  "Role",
                  "Member Since",
                  "Actions",
                ].map((_, idx) => (
                  <motion.th
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.03 }}
                    className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-dark-text uppercase tracking-wider"
                  >
                    <div className="h-4 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                  </motion.th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-dark-border">
              {[...Array(5)].map((_, rowIdx) => (
                <motion.tr
                  key={rowIdx}
                  initial={{ opacity: 0, x: -30  }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + rowIdx * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-card"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="h-7 w-24 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="h-7 w-20 bg-gray-200 dark:bg-dark-border rounded-full animate-pulse" />
                  </td>

                  {/* Member Since */}
                  <td className="px-6 py-4">
                    <div className="h-5 w-28 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-9 w-24 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </motion.div>
  );
}