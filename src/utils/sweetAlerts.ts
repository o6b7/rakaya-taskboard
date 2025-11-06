import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import toast from "react-hot-toast";

/**
 * Detects if dark mode is currently active
 */
const isDark = () => document.documentElement.classList.contains("dark");

/* -------------------------------------------------
   ✅ UNIVERSAL CONFIRMATION (SweetAlert2)
   ------------------------------------------------- */
interface ConfirmOptions {
  title: string;
  text?: string;
  icon?: "warning" | "info" | "question" | "success" | "error";
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export const confirmAction = async ({
  title,
  text = "",
  icon = "warning",
  confirmText = "Yes",
  cancelText = "Cancel",
  confirmColor = "#3085d6",
}: ConfirmOptions) => {
  const dark = isDark();

  return Swal.fire({
    title,
    text,
    icon,
    background: dark ? "#1f2937" : "#ffffff",
    color: dark ? "#f9fafb" : "#111827",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl shadow-lg border border-gray-700/20",
      actions: "flex justify-center gap-3 mt-4", // ✅ adds spacing between Yes/Cancel
      confirmButton: dark
        ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-colors"
        : "bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md transition-colors",
      cancelButton: dark
        ? "bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium px-6 py-2 rounded-md transition-colors"
        : "bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-6 py-2 rounded-md transition-colors",
    },
  });
};

/* -------------------------------------------------
   ✅ TOAST HELPERS (React Hot Toast + Dark Mode)
   ------------------------------------------------- */
const baseToast = {
  duration: 1500,
  style: {
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontWeight: 500,
  },
};

export const showSuccess = (message: string, text?: string) => {
  const dark = isDark();
  toast.success(text || message, {
    ...baseToast,
    duration: 1200,
    style: {
      ...baseToast.style,
      background: dark ? "#065f46" : "#d1fae5",
      color: dark ? "#a7f3d0" : "#065f46",
    },
  });
};

export const showError = (message: string, text?: string) => {
  const dark = isDark();
  toast.error(text || message, {
    ...baseToast,
    style: {
      ...baseToast.style,
      background: dark ? "#7f1d1d" : "#fee2e2",
      color: dark ? "#fca5a5" : "#991b1b",
    },
  });
};

export const showWarning = (message: string, text?: string) => {
  const dark = isDark();
  toast.warning(text || message, {
    ...baseToast,
    style: {
      ...baseToast.style,
      background: dark ? "#1f2937" : "#fef3c7",
      color: dark ? "#e5e7eb" : "#92400e",
    },
  });
};
