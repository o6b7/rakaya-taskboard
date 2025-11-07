import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useGetAllUsersQuery } from "../../api/users.api";
import Avatar from "../Common/Avatar";
import clsx from "clsx";
import { confirmAction, showSuccess } from "../../utils/sweetAlerts";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { useAppSelector, type RootState } from "../../store";

interface AddProjectMembersProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedUserIds: string[]) => void;
  currentMembers?: string[];
  viewOnly?: boolean;
}

export default function AddProjectMembers({
  isOpen,
  onClose,
  onConfirm,
  currentMembers = [],
  viewOnly: propViewOnly,
}: AddProjectMembersProps) {
  const { data: users = [], isLoading } = useGetAllUsersQuery();
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [removedMembers, setRemovedMembers] = useState<string[]>([]);

  // Get current user and active project
  const currentUser = useAppSelector((state: RootState) => state.auth.user);
  const activeProject = useAppSelector((state: RootState) => state.projects.activeProject);

  // Fallback to localStorage if not in Redux
  const currentUserId = currentUser?.id || localStorage.getItem("userId");

  // Determine if current user is owner
  const isOwner = activeProject?.ownerId === currentUserId;

  // Final viewOnly: forced if not owner, or if prop says so
  const viewOnly = propViewOnly || !isOwner;

  const filteredUsers = useMemo(() => {
    const baseList = viewOnly
      ? users.filter((u) => currentMembers.includes(u.id))
      : users;
    return baseList.filter(
      (u) =>
        (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (u.id?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [users, search, viewOnly, currentMembers]);

  const toggleUser = async (id: string) => {
    if (viewOnly) return;

    // Prevent owner from removing themselves
    if (
      currentMembers.includes(id) &&
      id === currentUserId &&
      activeProject?.ownerId === currentUserId
    ) {
      toast.error("You are the project owner and cannot remove yourself.");
      return;
    }

    // 🔸 If user is already a member
    if (currentMembers.includes(id)) {
      const isRemoved = removedMembers.includes(id);

      // 🧠 Reusable SweetAlert Confirmation
      const confirmed = await confirmAction({
        title: isRemoved
          ? "Restore this member?"
          : "Remove this member?",
        text: isRemoved
          ? "This will restore the member to the project."
          : "This will mark the member for removal.",
        icon: "warning",
        confirmText: isRemoved ? "Yes, restore" : "Yes, remove",
        cancelText: "Cancel",
        confirmColor: isRemoved ? "#16a34a" : "#d33",
      });

      if (!confirmed.isConfirmed) return;

      if (!isRemoved) {
        setRemovedMembers([...removedMembers, id]);
        await showSuccess("Marked for removal", "User has been marked for removal.");
      } else {
        setRemovedMembers(removedMembers.filter((uid) => uid !== id));
        toast("Removal cancelled", { icon: "↩️" });
      }
      return;
    }

    // 🔸 If user is being selected or deselected
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
      toast("User deselected", { icon: "❌" });
    } else {
      setSelectedUsers([...selectedUsers, id]);
      await showSuccess("User selected", "User has been added to selection.");
    }
  };

  const handleConfirm = () => {
    const updatedMembers = [
      ...currentMembers.filter((id) => !removedMembers.includes(id)),
      ...selectedUsers,
    ];
    onConfirm(updatedMembers);
    toast.success("Project members updated successfully!");
    setSelectedUsers([]);
    setRemovedMembers([]);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isOwner && !propViewOnly) {
      toast("Only the project owner can modify members.", { icon: "🔒" });
    }
  }, [isOpen, isOwner, propViewOnly]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-surface rounded-xl shadow-lg w-full max-w-md z-50 p-4"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-between items-center mb-4"
            >
              <h2 className="text-lg font-semibold dark:text-dark-text">
                {viewOnly ? "Project Members" : "Manage Members"}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
              </motion.button>
            </motion.div>

            {!viewOnly && (
              <motion.input
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 mb-4 border rounded-lg text-sm dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
              />
            )}

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 dark:text-dark-muted"
                >
                  Loading users...
                </motion.p>
              ) : filteredUsers.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 dark:text-dark-muted"
                >
                  No users found
                </motion.p>
              ) : (
                filteredUsers.map((user, index) => {
                  const isNewSelected = selectedUsers.includes(user.id);
                  const isRemoved = removedMembers.includes(user.id);
                  const isExisting = currentMembers.includes(user.id);
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                      whileHover={{ scale: viewOnly ? 1 : 1.02 }}
                      whileTap={{ scale: viewOnly ? 1 : 0.98 }}
                      onClick={() => toggleUser(user.id)}
                      disabled={viewOnly}
                      className={clsx(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-1 transition-colors",
                        viewOnly && "cursor-not-allowed opacity-75",
                        isNewSelected
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                          : isRemoved
                          ? "bg-red-100 dark:bg-red-900/20 text-red-600 line-through"
                          : isExisting
                          ? "bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text"
                          : "hover:bg-gray-100 dark:hover:bg-dark-card text-gray-700 dark:text-dark-text"
                      )}
                    >
                      <Avatar name={user.name} avatar={user.avatar || undefined} size={35} />
                      <span className="flex-1 text-left">
                        {user.name}
                        {isCurrentUser && " (You)"}
                        {activeProject?.ownerId === user.id && " (Owner)"}
                      </span>
                      {(isNewSelected || isRemoved) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex justify-end gap-2"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </motion.div>
              {!viewOnly && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="primary" onClick={handleConfirm}>
                    Save Changes
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}