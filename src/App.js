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

// Úkoly
import UserTasksPage from "./pages/UserTasksPage";
import AdminTasksPage from "./pages/AdminTasksPage";

// Chat
import ChatPage from "./pages/ChatPage";

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
      {/* ⬇️ Obalíme celé routování do TasksProvideru,
          aby badge + widget měly data všude (v obou layoutech). */}
      <TasksProvider user={user}>
        <Routes>
          {/* Veřejné */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/_ping" element={<div style={{ padding: 16 }}>pong</div>} />

          {/* User dashboard (jen role 'user') */}
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

          {/* Admin dashboard (jen role 'admin') */}
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

          {/* Lékárny – obě role (layout se zvolí podle role) */}
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
          {/* User checklist (povoleno oběma rolím; použije správný layout) */}
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
          {/* Admin správa úkolů */}
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

          {/* Chat – firemní/pobočkový */}
          <Route
              path="/chat"
              element={
                <ProtectedRoute roles={["user", "admin"]}>
                  <RoleLayout>
                    <ChatPage />
                  </RoleLayout>
                </ProtectedRoute>
            }
          />


          {/* Profil – obě role */}
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
          {/* Aliasy na profil */}
          <Route path="/user/profile" element={<Navigate to="/profile" replace />} />
          <Route path="/admin/profile" element={<Navigate to="/profile" replace />} />

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
