import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useSignupMutation } from "../../api/auth.api";
import { showSuccess, showError } from "../../utils/sweetAlerts";
import { useAppDispatch, useAppSelector } from "../../store";
import { getLucideIcon } from "../../lib/getLucideIcon";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase, one lowercase, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const PasswordRequirement = ({ ok, text }: { ok: boolean; text: string }) => (
  <div className="flex items-center gap-2">
    {ok ? (
      getLucideIcon("CheckCircle", { className: "w-4 h-4 text-green-500" })
    ) : (
      getLucideIcon("XCircle", { className: "w-4 h-4 text-green-400" })
    )}
    <span
      className={`text-sm ${
        ok ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-dark-muted"
      }`}
    >
      {text}
    </span>
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [signup, { isLoading }] = useSignupMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    min: false,
    upper: false,
    lower: false,
    num: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Monitor password strength
  useEffect(() => {
    setPasswordStrength({
      min: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      num: /\d/.test(password),
    });
  }, [password]);

    const handleRegistration = async (data: RegisterForm) => {
    try {
        const result = await signup({
        userData: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: "member",
        },
        }).unwrap();

        showSuccess(
        "Registration successful!",
        "Your account is pending owner approval. You will receive an email once it is activated."
        );

        navigate("/login", { replace: true });
    } catch (error: any) {
        const message =
        error?.data?.error || error?.error || "Registration failed. Please try again.";
        showError("Registration Error", message);
    }
    };


  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-muted">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
            {getLucideIcon("UserPlus", { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
            Join us today and get started
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-8 shadow-card dark:shadow-card-dark"
        >
          <form onSubmit={handleSubmit(handleRegistration)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                Full Name
              </label>
              <div className="relative">
                <Input
                  {...register("name")}
                  placeholder="John Doe"
                  className={`pl-10 ${
                    errors.name ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {getLucideIcon("User", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                Email Address
              </label>
              <div className="relative">
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 ${
                    errors.email ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {getLucideIcon("Mail", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className={`pl-10 pr-10 ${
                    errors.password ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {getLucideIcon("Lock", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-dark-text"
                >
                  {showPassword ? getLucideIcon("EyeOff", { className: "w-4 h-4" }) : getLucideIcon("Eye", { className: "w-4 h-4" })}
                </button>
              </div>

              {password && (
                <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg space-y-2">
                  <PasswordRequirement ok={passwordStrength.min} text="At least 8 characters" />
                  <PasswordRequirement ok={passwordStrength.upper} text="One uppercase letter" />
                  <PasswordRequirement ok={passwordStrength.lower} text="One lowercase letter" />
                  <PasswordRequirement ok={passwordStrength.num} text="One number" />
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`pl-10 pr-10 ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {getLucideIcon("Lock", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-dark-text"
                >
                  {showConfirmPassword ? getLucideIcon("EyeOff", { className: "w-4 h-4" }) : getLucideIcon("Eye", { className: "w-4 h-4" })}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full gap-2 py-3 text-base font-medium">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  {getLucideIcon("UserPlus", { className: "w-5 h-5" })}
                  Create Account
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 dark:text-dark-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
