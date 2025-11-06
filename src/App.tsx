import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "./store";

import ProjectPage from "./pages/Projects/ProjectPage";
import LoginPage from "./pages/Auth/Login";
import { validateToken } from "./lib/authorizedBaseQuery";
import Layout from "./components/Layout/Layout";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/Home/HomePage";

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
      <Toaster position="top-center" toastOptions={{ style: { background: '#363636', color: '#fff' } }}/>
      <Routes>
        
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/projects/:projectId"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />

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
