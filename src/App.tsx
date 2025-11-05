"use client";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./store";

import ProjectPage from "./pages/Projects/ProjectPage";
import LoginPage from "./pages/Auth/Login";
import { validateToken } from "./lib/authorizedBaseQuery";
import Layout from "./components/Layout/Layout";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const tokenValid = validateToken();

  if (!tokenValid || !isAuthenticated) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const token = localStorage.getItem("authToken");
  const tokenIsValid = token && validateToken();

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Private Routes (Layout auto-applied) */}
        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />

        {/* Example future private route */}
        {/* <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        /> */}

        {/* Default route: redirect depending on token */}
        <Route
          path="/"
          element={
            tokenIsValid
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
