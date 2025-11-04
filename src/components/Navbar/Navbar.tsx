import { Search, Bell, Mail, ChevronDown } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-dark-surface border-b border-surface-border dark:border-dark-border">
      {/* Search bar */}
      <div className="flex items-center flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, label, task or team member..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-dark-text placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Icons + Profile */}
      <div className="flex items-center gap-4 ml-6">
        {/* Message Icon */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
          <Mail className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
        </button>

        {/* Notification Icon */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition">
          <Bell className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://i.pravatar.cc/40?img=3"
            alt="User"
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-dark-border"
          />
          <span className="text-sm font-medium text-gray-800 dark:text-dark-text">
            Brandon Workman
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
