// src/pages/Settings/SettingsPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  X,
  User,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Avatar from "../../components/Common/Avatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAppSelector } from "../../store";
import { useUpdateUserMutation } from "../../api/users.api";
import { useDispatch } from "react-redux";
import {
  showSuccess,
  showError,
  confirmAction,
  showWarning,
} from "../../utils/sweetAlerts";
import { updateUser } from "../../store/slices/authSlice";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

/* ──────────────────────────────────────────────────────────────
   SAME PASSWORD RULES AS REGISTRATION
   ────────────────────────────────────────────────────────────── */
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase, one lowercase, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

/* ──────────────────────────────────────────────────────────────
   Password requirement UI component (same as RegisterPage)
   ────────────────────────────────────────────────────────────── */
const PasswordRequirement = ({
  ok,
  text,
}: {
  ok: boolean;
  text: string;
}) => (
  <div className="flex items-center gap-2">
    {ok ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-gray-400" />
    )}
    <span
      className={`text-sm ${
        ok
          ? "text-green-600 dark:text-green-400"
          : "text-gray-500 dark:text-dark-muted"
      }`}
    >
      {text}
    </span>
  </div>
);

export default function SettingsPage() {
  const dispatch = useDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [updateUserMutation, { isLoading: isUpdating }] =
    useUpdateUserMutation();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentUser?.avatar || null
  );
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ──────────────────────────────────────────────────────────────
     Profile form
     ────────────────────────────────────────────────────────────── */
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile,
    watch: watchProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    },
  });

  /* ──────────────────────────────────────────────────────────────
     Password form – now with strength tracking
     ────────────────────────────────────────────────────────────── */
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isDirty: isPasswordDirty },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watchPassword("newPassword", "");

  const [passwordStrength, setPasswordStrength] = useState({
    min: false,
    upper: false,
    lower: false,
    num: false,
  });

  // Update strength indicators in real-time
  useEffect(() => {
    setPasswordStrength({
      min: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      num: /\d/.test(newPassword),
    });
  }, [newPassword]);

  // Sync profile fields when user changes
  useEffect(() => {
    if (currentUser) {
      resetProfile({
        name: currentUser.name,
        email: currentUser.email,
      });
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [currentUser, resetProfile]);

  /* ──────────────────────────────────────────────────────────────
     Avatar handling
     ────────────────────────────────────────────────────────────── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError("File too large", "Please choose an image smaller than 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showError("Invalid file type", "Please choose a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      handleUpdate({ avatar: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    const result = await confirmAction({
      title: "Remove Profile Picture?",
      text: "Are you sure you want to remove your profile picture? This action cannot be undone.",
      icon: "warning",
      confirmText: "Yes, Remove",
      cancelText: "Keep Photo",
      confirmColor: "#dc2626",
    });

    if (result.isConfirmed) {
      setAvatarPreview(null);
      handleUpdate({ avatar: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      showSuccess("Profile picture removed successfully!");
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Generic update helper
     ────────────────────────────────────────────────────────────── */
  const handleUpdate = async (
    updates: Partial<ProfileForm & { avatar?: string }>
  ) => {
    if (!currentUser?.id) {
      showError("User not found");
      return;
    }

    try {
      const result = await updateUserMutation({
        id: currentUser.id,
        updates,
      }).unwrap();

      dispatch(updateUser(updates));
      return result;
    } catch (err) {
      showError("Failed to update profile");
      console.error("Update error:", err);
      throw err;
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Profile submit
     ────────────────────────────────────────────────────────────── */
  const onProfileSubmit = async (data: ProfileForm) => {
    const hasChanges =
      data.name !== currentUser?.name || data.email !== currentUser?.email;

    if (!hasChanges) {
      showWarning(
        "No changes detected",
        "Your profile information is already up to date."
      );
      return;
    }

    const result = await confirmAction({
      title: "Save Profile Changes?",
      text: "Are you sure you want to update your profile information?",
      icon: "question",
      confirmText: "Yes, Save Changes",
      cancelText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await handleUpdate(data);
        showSuccess(
          "Profile updated successfully!",
          "Your changes have been saved."
        );
      } catch {
        // handled inside handleUpdate
      }
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Password submit
     ────────────────────────────────────────────────────────────── */
  const onPasswordSubmit = async (data: PasswordForm) => {
    const result = await confirmAction({
      title: "Change Password?",
      text: "Are you sure you want to change your password? You'll need to use your new password next time you sign in.",
      icon: "question",
      confirmText: "Yes, Change Password",
      cancelText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setIsChangingPassword(true);
    try {
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await updateUserMutation({
        id: currentUser!.id,
        updates: { password: hashedPassword },
      }).unwrap();

      showSuccess("Password changed!", "Your password has been updated.");
      resetPassword();
      setShowPasswordForm(false);
    } catch (err: any) {
      const msg =
        err?.data?.error ||
        err?.error ||
        "Failed to change password. Please check your current password.";
      showError("Password Update Failed", msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    resetPassword();
    setShowPasswordForm(false);
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="text-gray-500 dark:text-dark-muted">
          Loading user information...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Account Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-dark-muted">
            Manage your profile information, security, and preferences.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Profile & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-6 shadow-card dark:shadow-card-dark"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">
                    Update your name and email address
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleProfileSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                      Full Name
                    </label>
                    <Input
                      {...registerProfile("name")}
                      placeholder="John Doe"
                      className={`w-full dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-gray-500 ${
                        profileErrors.name
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {profileErrors.name && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                      Email Address
                    </label>
                    <Input
                      {...registerProfile("email")}
                      type="email"
                      placeholder="john@example.com"
                      className={`w-full dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-gray-500 ${
                        profileErrors.email
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {profileErrors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={!isProfileDirty || isUpdating}
                    className="gap-2 min-w-[140px]"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-6 shadow-card dark:shadow-card-dark"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">
                    Manage your password and account security
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {!showPasswordForm ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-dark-text">
                        Password
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-dark-muted">
                        Last changed 2 weeks ago
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPasswordForm(true)}
                      className="gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form
                        onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                        className="space-y-4"
                      >
                        {/* Current Password */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                            Current Password
                          </label>
                          <div className="relative">
                            <Input
                              {...registerPassword("oldPassword")}
                              type={showOldPass ? "text" : "password"}
                              placeholder="Enter your current password"
                              className="w-full dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-gray-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPass(!showOldPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text"
                            >
                              {showOldPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.oldPassword && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {passwordErrors.oldPassword.message}
                            </p>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                              New Password
                            </label>
                            <div className="relative">
                              <Input
                                {...registerPassword("newPassword")}
                                type={showNewPass ? "text" : "password"}
                                placeholder="Enter new password"
                                className="w-full dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-gray-500 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text"
                              >
                                {showNewPass ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {/* Strength indicators */}
                            {newPassword && (
                              <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg space-y-2">
                                <PasswordRequirement
                                  ok={passwordStrength.min}
                                  text="At least 8 characters"
                                />
                                <PasswordRequirement
                                  ok={passwordStrength.upper}
                                  text="One uppercase letter"
                                />
                                <PasswordRequirement
                                  ok={passwordStrength.lower}
                                  text="One lowercase letter"
                                />
                                <PasswordRequirement
                                  ok={passwordStrength.num}
                                  text="One number"
                                />
                              </div>
                            )}

                            {passwordErrors.newPassword && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                {passwordErrors.newPassword.message}
                              </p>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <Input
                                {...registerPassword("confirmPassword")}
                                type={showConfirmPass ? "text" : "password"}
                                placeholder="Confirm new password"
                                className="w-full dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-gray-500 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPass(!showConfirmPass)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text"
                              >
                                {showConfirmPass ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                {passwordErrors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancelPassword}
                            disabled={isChangingPassword}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={!isPasswordDirty || isChangingPassword}
                            className="gap-2 min-w-[140px]"
                          >
                            {isChangingPassword ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {isChangingPassword
                              ? "Updating..."
                              : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile Picture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Profile Picture Card */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-6 shadow-card dark:shadow-card-dark">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                    Profile Picture
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">
                    Update your profile photo
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <Avatar
                    name={currentUser.name}
                    avatar={avatarPreview || undefined}
                    size={140}
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </Button>
                  {avatarPreview && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-dark-muted">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                    Recommended: 500x500 pixels
                  </p>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-6 shadow-card dark:shadow-card-dark">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-4">
                Account Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-muted">
                    Member since
                  </span>
                  <span className="text-gray-900 dark:text-dark-text font-medium">
                    {currentUser.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-muted">
                    Role
                  </span>
                  <span className="text-gray-900 dark:text-dark-text font-medium capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-dark-muted">
                    User ID
                  </span>
                  <span className="text-gray-900 dark:text-dark-text font-medium text-xs">
                    {currentUser.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}