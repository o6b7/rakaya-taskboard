import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../store';
import { useGetProjectsQuery } from '../../api/projects.api';
import { useGetTasksQuery } from '../../api/tasks.api';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const HomePage: React.FC = () => {
  const isDarkMode = useAppSelector((state) => state.ui.darkMode);
  const { data: projects = [], isLoading: isProjectsLoading } = useGetProjectsQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Filter projects where user is owner or member
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userProjects = useMemo(() => {
    return projects.filter(
      (p) => p.ownerId === userId || p.members?.includes(userId || '')
    );
  }, [projects, userId]);

  // Fetch tasks based on selected project
  const { data: tasks = [] } = useGetTasksQuery(undefined, {
    skip: selectedProjectId !== 'all',
  });

  const projectTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // === 1. Priority Distribution ===
  const priorityData = useMemo(() => {
    const counts = projectTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return ['Low', 'Medium', 'High'].map((priority) => ({
      name: priority,
      count: counts[priority] || 0,
    }));
  }, [projectTasks]);

  // === 2. Status (Column) Distribution - Organized workflow ===
  const statusData = useMemo(() => {
    const statusMap: Record<string, string> = {
      backlog: 'Backlog',
      todo: 'To Do',
      inprogress: 'In Progress',
      needreview: 'Need Review',
      done: 'Done',
    };

    // Define the order for consistent display
    const statusOrder = ['Backlog', 'To Do', 'In Progress', 'Need Review', 'Done'];

    const counts = projectTasks.reduce((acc, task) => {
      const statusLabel = statusMap[task.column] || task.column;
      acc[statusLabel] = (acc[statusLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return data in the defined order
    return statusOrder.map((status) => ({
      name: status,
      count: counts[status] || 0,
    }));
  }, [projectTasks]);

  // === 3. Monthly Task Assignment ===
  const monthlyData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now,
    });

    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthStr = format(month, 'MMM yyyy');

      const count = projectTasks.filter((task) => {
        const created = new Date(task.createdAt);
        return created >= start && created <= end;
      }).length;

      return { month: monthStr, count };
    });
  }, [projectTasks]);

  const selectedProjectName =
    selectedProjectId === 'all'
      ? 'All Projects'
      : userProjects.find((p) => p.id === selectedProjectId)?.name || 'Unknown';

  // Dark mode text color for charts
  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = isDarkMode ? '#2a2e33' : '#e5e7eb';
  const tooltipBg = isDarkMode ? '#1a1d21' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#2a2e33' : '#e5e7eb';
  const tooltipTextColor = isDarkMode ? '#ffffff' : '#374151'; // White text in dark mode

  if (isProjectsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-screen items-center justify-center"
      >
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading projects...</p>
      </motion.div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text sm:text-3xl">
            Project Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-dark-muted">
            Analytics and insights for your tasks and projects
          </p>
        </motion.div>

        {/* Project Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
            Select Project
          </label>
          <div className="relative max-w-full">
            <motion.select
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-dark-border bg-white dark:bg-dark-card px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-dark-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-border dark:focus:border-primary-400"
            >
              <option value="all">All Projects</option>
              {userProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </motion.select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-dark-muted" />
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl bg-white p-6 shadow-card dark:bg-dark-card dark:shadow-card-dark"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-dark-text">
              Task Distribution by Priority — {selectedProjectName}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '0.5rem',
                    color: tooltipTextColor,
                  }}
                  labelStyle={{ color: tooltipTextColor }}
                  itemStyle={{ color: tooltipTextColor }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-xl bg-white p-6 shadow-card dark:bg-dark-card dark:shadow-card-dark"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-dark-text">
              Task Distribution by Status — {selectedProjectName}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fill: textColor }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '0.5rem',
                    color: tooltipTextColor,
                  }}
                  itemStyle={{ color: tooltipTextColor }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Monthly Task Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-xl bg-white p-6 shadow-card dark:bg-dark-card dark:shadow-card-dark lg:col-span-2"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-dark-text">
              Tasks Assigned Per Month — {selectedProjectName}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis 
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '0.5rem',
                    color: tooltipTextColor,
                  }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;