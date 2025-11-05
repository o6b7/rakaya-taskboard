"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import bcrypt from "bcryptjs";
import jwtEncode from "jwt-encode";
import { useAppDispatch } from "../../store";
import { useGetAllUsersQuery } from "../../api/users.api";
import { setCredentials, startLoading, stopLoading } from "../../store/slices/authSlice";
import { Button } from "../../components/ui/Button";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: users } = useGetAllUsersQuery();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(startLoading());

    try {
      // Find user by email
      const user = users?.find((u) => u.email === email);
      if (!user) {
        setError("Invalid email or password.");
        return;
      }

      // Compare encrypted password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        setError("Invalid email or password.");
        return;
      }


    const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2h
    const payload = { id: user.id, email: user.email, role: user.role, exp: expiresAt };
    const token = jwtEncode(payload, import.meta.env.VITE_JWT_SECRET_KEY);



      dispatch(setCredentials({ token, user }));
      navigate("/projects/P1"); 
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      dispatch(stopLoading());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-8 sm:p-10">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-dark-text mb-6">
          Sign in to Your Account
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-gray-800 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-gray-800 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-danger-600 text-sm text-center mt-1">{error}</p>
          )}

          <Button type="submit" className="w-full mt-4">
            Sign In
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-dark-muted mt-4">
            Only a <span className="font-medium text-primary-600">Manager</span> can create an account for you.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;