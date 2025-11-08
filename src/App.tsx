import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store";

import ProjectPage from "./pages/Projects/ProjectPage";
import LoginPage from "./pages/Auth/Login";
import { validateToken } from "./lib/authorizedBaseQuery";
import Layout from "./components/Layout/Layout";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/Home/HomePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import { jwtDecode } from "jwt-decode";
import { clearCredentials, setCredentials, finishAuthInitialization } from "./store/slices/authSlice";
import UsersPage from "./pages/Users/UsersPage";
import CalendarPage from "./pages/Calendar/CalendarPage";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthInitialized } = useAppSelector((state) => state.auth);

  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }


  if (!isAuthenticated || !validateToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AuthLoader() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("authUser");

    try {
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const decoded: any = jwtDecode(token);

        if (decoded.exp * 1000 > Date.now()) {
          dispatch(setCredentials({ token, user }));
        } else {
          dispatch(clearCredentials());
        }
      } else {
        dispatch(clearCredentials());
      }
    } catch {
      dispatch(clearCredentials());
    } finally {
      console.log("Auth initialization finished ✅");
      dispatch(finishAuthInitialization());
    }
  }, [dispatch]);

  return null;
}

const App: React.FC = () => {
  return (
    <Router>
      {/* AuthLoader ensures Redux state is ready before routes render */}
      <AuthLoader />

      <Toaster position="top-center" toastOptions={{ style: { background: "#363636", color: "#fff" } }} />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />


        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to={window.location.pathname} replace />} />
      </Routes>
    </Router>
  );
};

export default App;
