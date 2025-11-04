// src/utils/sweetAlerts.ts
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const isDarkMode = document.documentElement.classList.contains("dark");

export const confirmRemoveAttachment = async (): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Remove this picture?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove it!",
    cancelButtonText: "No, keep it",
    reverseButtons: true,
    background: isDarkMode ? "#1a1d21" : "#ffffff",
    color: isDarkMode ? "#e5e7eb" : "#111827",
    confirmButtonColor: isDarkMode ? "#ef4444" : "#ef4444",
    cancelButtonColor: isDarkMode ? "#9ca3af" : "#6b7280",
    customClass: {
      confirmButton: isDarkMode
        ? "swal2-confirm bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
        : "bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors",
      cancelButton: isDarkMode
        ? "swal2-cancel bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
        : "bg-gray-600 hover:bg-gray-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors",
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp",
    },
  });

  return result.isConfirmed;
};

export const showWarning = (message: string) => {
  Swal.fire({
    icon: "warning",
    title: message,
    timer: 1500,
    showConfirmButton: false,
    background: isDarkMode ? "#1a1d21" : "#ffffff",
    color: isDarkMode ? "#e5e7eb" : "#111827",
  });
};

export const showSuccess = (message: string) => {
  Swal.fire({
    icon: "success",
    title: message,
    timer: 1200,
    showConfirmButton: false,
    background: isDarkMode ? "#1a1d21" : "#ffffff",
    color: isDarkMode ? "#e5e7eb" : "#111827",
  });
};