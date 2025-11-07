import React, { useState, useMemo } from "react";
import {
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../api/users.api";
import { useAppSelector } from "../../store";
import { motion } from "framer-motion";
import {
  Search,
  UserCheck,
  UserX,
  Crown,
  Trash2,
  Shield,
  Loader2,
} from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import Avatar from "../../components/Common/Avatar";
import {
  showSuccess,
  showError,
  confirmAction,
} from "../../utils/sweetAlerts";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { format } from "date-fns";

export default function UsersPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { data: users = [], isLoading } = useGetAllUsersQuery();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [searchQuery, setSearchQuery] = useState("");

  const isOwner = currentUser?.role === "owner";

  // ──────────────────────────────────────────────────────────────
  // 1. Safe search – guard against undefined fields
  // ──────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const id = (u.id ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }, [users, searchQuery]);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────
  const handleAuthorize = async (id: string, authorized: boolean) => {
    try {
      await updateUser({ id, updates: { authorized } }).unwrap();
      showSuccess(
        authorized ? "User Authorized" : "Authorization Revoked",
        authorized
          ? "User can now log in."
          : "User is blocked from logging in."
      );
    } catch {
      showError("Failed to update authorization");
    }
  };

  const handleSetOwner = async (id: string) => {
    const result = await confirmAction({
      title: "Make User Owner?",
      text: "This will give them full admin access. You will lose exclusive owner status.",
      icon: "warning",
      confirmText: "Yes, Make Owner",
      cancelText: "Cancel",
      confirmColor: "#f59e0b",
    });
    if (!result.isConfirmed) return;

    try {
      await updateUser({ id, updates: { role: "owner" } }).unwrap();
      showSuccess("Owner Assigned", "User is now an owner.");
    } catch {
      showError("Failed to assign owner");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await confirmAction({
      title: "Delete User?",
      text: "This action cannot be undone. All data will be lost.",
      icon: "warning",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      confirmColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteUser(id).unwrap();
      showSuccess("User Deleted", "Account has been removed.");
    } catch {
      showError("Failed to delete user");
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Block non-owners
  // ──────────────────────────────────────────────────────────────
  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 dark:text-dark-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-dark-muted mt-1">
            Only owners can manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">
                User Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-dark-muted mt-1">
                Authorize users, assign roles, and manage access
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-muted" />
              <Input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
          </div>
        </motion.div>

        {/* Mobile Table */}
        <div className="sm:hidden w-full mx-auto overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface border dark:border-dark-border">
          <div className="min-w-[640px]">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                  {["User", "Status", "Role", "Joined", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-dark-muted uppercase tracking-wider text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-dark-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-dark-muted text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} avatar={user.avatar} size={36} />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-dark-text">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-muted">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-600">
                              ID: {user.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.authorized
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {user.authorized ? (
                            <>
                              {getLucideIcon("CheckCircle", { size: 12 })}
                              Authorized
                            </>
                          ) : (
                            <>
                              {getLucideIcon("XCircle", { size: 12 })}
                              Pending
                            </>
                          )}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "owner"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {user.role === "owner" ? (
                            <>
                              {getLucideIcon("Crown", { size: 12 })}
                              Owner
                            </>
                          ) : (
                            "Member"
                          )}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-dark-muted">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "MMM dd, yyyy")
                          : "-"}
                      </td>

                      {/* ────────────────────────────────────────
                          2. Fixed icon spacing – each button has its own slot
                          ──────────────────────────────────────── */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Authorize / Revoke */}
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant={user.authorized ? "ghost" : "default"}
                              onClick={() =>
                                handleAuthorize(user.id, !user.authorized)
                              }
                              className="h-8 w-8 p-0"
                              title={user.authorized ? "Revoke Access" : "Authorize"}
                            >
                              {user.authorized ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          {/* Make Owner */}
                          {user.id !== currentUser?.id && user.role !== "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetOwner(user.id)}
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                              title="Make Owner"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Delete */}
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block w-full overflow-x-auto rounded-2xl bg-white dark:bg-dark-surface border dark:border-dark-border">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-surface-border dark:border-dark-border bg-gray-50 dark:bg-dark-card">
                {[
                  "User",
                  "Email",
                  "Status",
                  "Role",
                  "Member Since",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-dark-text uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-dark-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-5 dark:from-gray-800 dark:to-gray-900">
                        {getLucideIcon("Users", {
                          className: "h-12 w-12 text-gray-400 dark:text-gray-600",
                        })}
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-dark-text">
                        No users found
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-dark-muted">
                        Try adjusting your search.
                      </p>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} avatar={user.avatar} size={40} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-dark-text">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-muted">
                            ID: {user.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-dark-muted">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          user.authorized
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        }`}
                      >
                        {user.authorized ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Authorized
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          user.role === "owner"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        }`}
                      >
                        {user.role === "owner" ? (
                          <>
                            <Crown className="w-3.5 h-3.5" />
                            Owner
                          </>
                        ) : (
                          "Member"
                        )}
                      </span>
                    </td>

                    {/* Member Since */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-dark-muted">
                      {user.createdAt
                        ? format(new Date(user.createdAt), "MMM dd, yyyy")
                        : "-"}
                    </td>

                    {/* Actions – fixed spacing */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Authorize / Revoke */}
                        {user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant={user.authorized ? "outline" : "default"}
                            onClick={() =>
                              handleAuthorize(user.id, !user.authorized)
                            }
                            className="gap-1.5"
                          >
                            {user.authorized ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Authorize
                              </>
                            )}
                          </Button>
                        )}

                        {/* Make Owner */}
                        {user.id !== currentUser?.id && user.role !== "owner" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetOwner(user.id)}
                            className="gap-1.5 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Make Owner
                          </Button>
                        )}

                        {/* Delete */}
                        {user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id)}
                            className="gap-1.5 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}