import React, { useState, useMemo, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useGetAllUsersQuery } from "../../api/users.api";
import Avatar from "../Common/Avatar";
import clsx from "clsx";
import { confirmRemoveAttachment } from "../../utils/sweetAlerts";
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
    if (currentMembers.includes(id) && id === currentUserId && activeProject?.ownerId === currentUserId) {
      toast.error("You are the project owner and cannot remove yourself.");
      return;
    }

    if (currentMembers.includes(id)) {
      const isRemoved = removedMembers.includes(id);
      const confirmed = await confirmRemoveAttachment(isRemoved);
      if (!confirmed) return;

      if (!isRemoved) {
        setRemovedMembers([...removedMembers, id]);
        toast.success("User marked for removal");
      } else {
        setRemovedMembers(removedMembers.filter((uid) => uid !== id));
        toast("Removal cancelled", { icon: "↩️" });
      }
      return;
    }

    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
      toast.success("User selected");
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-surface rounded-xl shadow-lg w-full max-w-md z-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold dark:text-dark-text">
            {viewOnly ? "Project Members" : "Manage Members"}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
          </button>
        </div>

        {!viewOnly && (
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-4 border rounded-lg text-sm dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
          />
        )}

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-dark-muted">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-dark-muted">No users found</p>
          ) : (
            filteredUsers.map((user) => {
              const isNewSelected = selectedUsers.includes(user.id);
              const isRemoved = removedMembers.includes(user.id);
              const isExisting = currentMembers.includes(user.id);
              const isCurrentUser = user.id === currentUserId;

              return (
                <button
                  key={user.id}
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
                  {(isNewSelected || isRemoved) && <Check className="w-4 h-4" />}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!viewOnly && (
            <Button variant="primary" onClick={handleConfirm}>
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </>
  );
}