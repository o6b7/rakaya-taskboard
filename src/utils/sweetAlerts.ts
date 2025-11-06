// sweetAlerts.ts
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import toast from "react-hot-toast";

/**
 * Detects current dark mode dynamically each time it's called.
 */
const isDark = () => document.documentElement.classList.contains("dark");

/* -------------------------------------------------
   Confirmation (SweetAlert2) – with proper dark mode detection
   ------------------------------------------------- */
export const confirmRemoveAttachment = async (isRestore = false): Promise<boolean> => {
  const darkMode = isDark();

  const result = await Swal.fire({
    title: isRestore ? "Restore this member?" : "Remove this member?",
    text: isRestore
      ? "The member will be added back to the project."
      : "You won't be able to revert this until submission!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: isRestore ? "Yes, restore!" : "Yes, remove it!",
    cancelButtonText: isRestore ? "No, keep removed" : "No, keep it",
    reverseButtons: true,
    background: darkMode ? "#1a1d21" : "#ffffff",
    color: darkMode ? "#e5e7eb" : "#111827",
    confirmButtonColor: "#10b981",
    cancelButtonColor: darkMode ? "#6b7280" : "#9ca3af",
    customClass: {
      confirmButton:
        "bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors",
      cancelButton: darkMode
        ? "bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
        : "bg-gray-500 hover:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg transition-colors",
      popup: darkMode ? "shadow-card-dark" : "shadow-card",
    },
    showClass: { popup: "animate__animated animate__fadeInDown" },
    hideClass: { popup: "animate__animated animate__fadeOutUp" },
  });

  return result.isConfirmed;
};

/* -------------------------------------------------
   Toast helpers – darkMode passed in
   ------------------------------------------------- */
const toastOptions = {
  duration: 1500,
  style: {
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontWeight: "500",
  },
};

export const showWarning = (message: string, darkMode: boolean) => {
  toast.warning(message, {
    ...toastOptions,
    style: {
      ...toastOptions.style,
      background: darkMode ? "#1f2937" : "#fef3c7",
      color: darkMode ? "#e5e7eb" : "#92400e",
    },
  });
};

export const showSuccess = (message: string, darkMode: boolean) => {
  toast.success(message, {
    ...toastOptions,
    duration: 1200,
    style: {
      ...toastOptions.style,
      background: darkMode ? "#065f46" : "#d1fae5",
      color: darkMode ? "#a7f3d0" : "#065f46",
    },
  });
};

export const showError = (message: string, darkMode: boolean) => {
  toast.error(message, {
    ...toastOptions,
    style: {
      ...toastOptions.style,
      background: darkMode ? "#7f1d1d" : "#fee2e2",
      color: darkMode ? "#fca5a5" : "#991b1b",
    },
  });
};