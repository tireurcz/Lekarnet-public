// src/components/DashboardLayout.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  LogOut,
  Users,
  Search,
  Bell,
  FileText,
  Boxes,
  User as UserIcon,
  CheckSquare,
} from "lucide-react";

// ⬇️ NOVÉ: badge pro úkoly
import TasksBadge from "./TasksBadge";

/* ---------- společné drobnosti ---------- */
const Topbar = ({ roleLabel = "Uživatel" }) => (
  <div className="sticky top-0 z-10 -mx-8 mb-6 px-8 py-4 bg-gradient-to-r from-white/80 via-white/60 to-white/80 backdrop-blur-md border-b border-blue-100 flex items-center gap-4">
    <h1 className="text-2xl md:text-3xl font-black text-blue-900">Přehled</h1>
    <div className="ml-auto flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2">
        <Search size={18} className="opacity-70" />
        <input placeholder="Hledat…" className="w-56 outline-none text-sm placeholder:text-blue-900/40" />
      </div>
      <button className="relative rounded-xl p-2 border border-blue-200 bg-white hover:bg-blue-50">
        <Bell size={18} />
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
      </button>
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
        <span className="text-sm font-medium text-blue-900">{roleLabel}</span>
      </div>
    </div>
  </div>
);

function NavItem({ to, icon: Icon, label, rightSlot = null }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-all
        ${active ? "bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" : "hover:bg-white/10"}`}
    >
      <Icon size={20} className="opacity-90" />
      <span className="font-medium">{label}</span>
      {/* ⬇️ NOVÉ: místo pro badge/pravý slot */}
      {rightSlot && <span className="ml-auto">{rightSlot}</span>}
      {active && !rightSlot && <span className="ml-auto h-6 w-6 rounded-lg bg-white/10 backdrop-blur-sm" />}
    </Link>
  );
}

function SidebarFrame({ children }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/", { replace: true });
  };

  return (
    <aside className="relative w-72 min-h-screen p-6 text-white bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 shadow-xl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-400/20 via-white/5 to-transparent blur-2xl" />
      </div>

      <h2 className="relative text-2xl font-extrabold tracking-tight mb-10">Lékárnet</h2>
      <nav className="relative space-y-2">
        {children}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 rounded-xl px-3 py-2 transition-all bg-white/10 hover:bg-white/20"
        >
          <LogOut size={20} />
          <span className="font-medium">Odhlásit se</span>
        </button>
      </nav>

      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </aside>
  );
}

/* ---------- USER layout ---------- */
export function UserDashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_45%)]">
      <SidebarFrame>
        <NavItem to="/user/dashboard" icon={Home} label="Dashboard" />
        {/* ⬇️ NOVÉ: Úkoly s badge */}
        <NavItem
          to="/tasks"
          icon={CheckSquare}
          label="Úkoly"
          rightSlot={<TasksBadge />}
        />
        <NavItem to="/pharmacy/report" icon={FileText} label="Report pro lékárny (PDF)" />
        <NavItem to="/pharmacy/inventory" icon={Boxes} label="Sklad / návrhy přesunu" />

        <div className="pt-4">
          <p className="text-xs uppercase tracking-wider text-blue-200/80 mb-2">Nastavení</p>
          <NavItem to="/profile" icon={UserIcon} label="Profil" />
        </div>
      </SidebarFrame>

      <main className="flex-1 bg-gradient-to-b from-blue-50 to-white p-8 overflow-y-auto">
        <Topbar roleLabel="Uživatel" />
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

/* ---------- ADMIN layout ---------- */
export function AdminDashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_45%)]">
      <SidebarFrame>
        <NavItem to="/admin/dashboard" icon={Home} label="Přehled (admin)" />
        {/* ⬇️ NOVÉ: Úkoly (správa) s badge – stejný count je v pohodě, sdílí kontext */}
        <NavItem
          to="/admin/tasks"
          icon={CheckSquare}
          label="Úkoly (správa)"
          rightSlot={<TasksBadge />}
        />
        <NavItem to="/pharmacy/report" icon={FileText} label="Report pro lékárny (PDF)" />
        <NavItem to="/pharmacy/inventory" icon={Boxes} label="Sklad / návrhy přesunu" />

        <div className="pt-4">
          <p className="text-xs uppercase tracking-wider text-blue-200/80 mb-2">Nastavení</p>
          <NavItem to="/profile" icon={UserIcon} label="Profil" />
          <NavItem to="/admin/users" icon={Users} label="Uživatelé" />
          <NavItem to="/admin/permissions" icon={Settings} label="Oprávnění" />
        </div>
      </SidebarFrame>

      <main className="flex-1 bg-gradient-to-b from-blue-50 to-white p-8 overflow-y-auto">
        <Topbar roleLabel="Admin" />
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export default AdminDashboardLayout; // volitelně, kdyby někde očekával "default"
