// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PharmacyReportPage from "./pages/PharmacyReportPage";
import PharmacyInventoryPage from "./pages/PharmacyInventoryPage";
import ProfilePage from "./pages/ProfilePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import UploadPage from "./pages/UpLoadPage";

// Úkoly
import UserTasksPage from "./pages/UserTasksPage";
import AdminTasksPage from "./pages/AdminTasksPage";

// DVA layouty
import { UserDashboardLayout, AdminDashboardLayout } from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// ⬇️ NOVÉ: kontext pro úkoly (widget + badge)
import { TasksProvider } from "./context/TasksContext";

// helper: načtení přihlášeného uživatele z localStorage
function readAuthUser() {
  try {
    const raw = localStorage.getItem("auth:user");
    if (raw) return JSON.parse(raw);
    // fallback – pokud někde ukládáš jen dílčí hodnoty
    const id = localStorage.getItem("userId") || localStorage.getItem("_id") || null;
    const role = localStorage.getItem("userRole") || "user";
    return id ? { id, role } : null;
  } catch {
    return null;
  }
}

// pro trasy přístupné oběma rolím – zvolí layout podle role z localStorage
const RoleLayout = ({ children }) => {
  const role = localStorage.getItem("userRole") || "user";
  const Layout = role === "admin" ? AdminDashboardLayout : UserDashboardLayout;
  return <Layout>{children}</Layout>;
};

export default function App() {
  const user = readAuthUser();

  return (
    <Router>
      <TasksProvider user={user}>
        <Routes>
          {/* Veřejné */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/_ping" element={<div style={{ padding: 16 }}>pong</div>} />

          {/* User dashboard */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute roles={["user"]}>
                <UserDashboardLayout>
                  <UserDashboardPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardLayout>
                  <AdminDashboardPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Lékárny – obě role */}
          <Route
            path="/pharmacy/report"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <RoleLayout>
                  <PharmacyReportPage />
                </RoleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/inventory"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <RoleLayout>
                  <PharmacyInventoryPage />
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          {/* Úkoly */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <RoleLayout>
                  <UserTasksPage />
                </RoleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardLayout>
                  <AdminTasksPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Profil */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <RoleLayout>
                  <ProfilePage />
                </RoleLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/user/profile" element={<Navigate to="/profile" replace />} />
          <Route path="/admin/profile" element={<Navigate to="/profile" replace />} />

          {/* Upload exportů */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <RoleLayout>
                  <UploadPage />
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin: Uživatelé */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardLayout>
                  <AdminUsersPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div className="p-6">404 – stránka nenalezena</div>} />
        </Routes>
      </TasksProvider>
    </Router>
  );
}