import React from "react";
import { Plus } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  icon?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  icon = false,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 sm:px-5 py-2.5 text-sm font-medium transition-all duration-200";

  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 dark:active:bg-blue-700"
      : "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {icon && <Plus className="w-4 h-4" />}
      {children}
    </button>
  );
};
