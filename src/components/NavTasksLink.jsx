import React from "react";
import { NavLink } from "react-router-dom";
import TasksBadge from "./TasksBadge";

export default function NavTasksLink(){
  return (
    <NavLink
      to="/tasks"
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-semibold' : ''}`
      }
    >
      <span className="i-lucide-list-checks h-5 w-5" aria-hidden />
      <span>Úkoly</span>
      <TasksBadge />
    </NavLink>
  );
}