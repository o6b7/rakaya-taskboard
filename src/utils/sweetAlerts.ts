import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/**
 * Detects current dark mode dynamically each time it's called.
 */
const isDark = () => document.documentElement.classList.contains("dark");

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
    confirmButtonColor: "#10b981", // consistent green
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

export const showWarning = (message: string) => {
  const darkMode = isDark();

  Swal.fire({
    icon: "warning",
    title: message,
    timer: 1500,
    showConfirmButton: false,
    background: darkMode ? "#1a1d21" : "#ffffff",
    color: darkMode ? "#e5e7eb" : "#111827",
  });
};

export const showSuccess = (message: string) => {
  const darkMode = isDark();

  Swal.fire({
    icon: "success",
    title: message,
    timer: 1200,
    showConfirmButton: false,
    background: darkMode ? "#1a1d21" : "#ffffff",
    color: darkMode ? "#e5e7eb" : "#111827",
  });
};
