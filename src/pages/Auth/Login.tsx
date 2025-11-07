import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useLoginMutation } from "../../api/auth.api";
import { showError } from "../../utils/sweetAlerts";
import { useAppDispatch, useAppSelector } from "../../store";
import { setCredentials } from "../../store/slices/authSlice";
import { getLucideIcon } from "../../lib/getLucideIcon";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [login, { isLoading }] = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const { user, token } = await login({
        email: data.email,
        password: data.password,
      }).unwrap();

      dispatch(setCredentials({ user, token }));
    } catch (err: any) {
      showError("Login Failed", err?.error || "Invalid email or password");
    }
  };

  // Redirecting spinner
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
            {getLucideIcon("LogIn", { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
            Sign in to continue to your account
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-8 shadow-card dark:shadow-card-dark"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  className={`pl-10 ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {getLucideIcon("Lock", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-muted" })}
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
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 ${errors.password ? "border-red-500 focus:ring-red-500" : ""}`}
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
              {errors.password && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 py-3 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {getLucideIcon("LogIn", { className: "w-5 h-5" })}
                  Sign In
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Create Account Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 dark:text-dark-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Create one here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}