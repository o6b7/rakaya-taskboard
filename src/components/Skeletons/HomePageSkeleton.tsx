import React from "react";
import { motion } from "framer-motion";
import { getLucideIcon } from "../../lib/getLucideIcon";

export default function HomePageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-dark-bg px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="h-8 w-64 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse" />
          <div className="mt-2 h-5 w-96 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
        </motion.div>

        {/* Project Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="h-5 w-32 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-2" />
          <div className="relative">
            <div className="h-11 w-full bg-white dark:bg-dark-card border border-dark-border dark:border-dark-border rounded-lg flex items-center px-4 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 dark:bg-dark-border rounded" />
            </div>
            {getLucideIcon("ChevronDown", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
            ChevronDown
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Priority Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-card dark:shadow-card-dark"
          >
            <div className="h-6 w-64 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-6" />

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                  <div className="flex-1 h-10 bg-gray-100 dark:bg-dark-surface rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gray-300 dark:bg-dark-muted animate-pulse"
                      style={{
                        width: `${Math.random() * 60 + 30}%`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-muted animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-card dark:shadow-card-dark"
          >
            <div className="h-6 w-64 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-6" />

            <div className="flex justify-center items-center h-64">
              <div className="relative w-48 h-48">
                {/* Donut ring skeleton - neutral gray */}
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="36"
                    className="dark:stroke-dark-border"
                  />
                  {[...Array(5)].map((_, i) => {
                    const angle = (i * 72 - 90) * (Math.PI / 180);
                    const x1 = 100 + 44 * Math.cos(angle);
                    const y1 = 100 + 44 * Math.sin(angle);
                    const x2 = 100 + 80 * Math.cos(angle);
                    const y2 = 100 + 80 * Math.sin(angle);
                    const largeArc = i % 2 === 0 ? 1 : 0;
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} A 44 44 0 ${largeArc} 1 ${x2} ${y2}`}
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="36"
                        className="dark:stroke-dark-muted animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 bg-gray-100 dark:bg-dark-surface rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-muted animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Line Chart - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-card dark:shadow-card-dark lg:col-span-2"
          >
            <div className="h-6 w-72 bg-gray-200 dark:bg-dark-border rounded animate-pulse mb-6" />

            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[...Array(6)].map((_, i) => {
                const height = Math.random() * 60 + 20;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gray-300 dark:bg-dark-muted rounded-t-lg animate-pulse"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-muted animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}