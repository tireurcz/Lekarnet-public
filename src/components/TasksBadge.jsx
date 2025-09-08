import React from "react";
import { useTasks } from "../context/TasksContext";

export default function TasksBadge({ className = "" }) {
  const { badgeCount, loading } = useTasks();
  if (loading) return null;
  if (!badgeCount) return null;
  return (
    <span className={`ml-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 h-4 min-w-4 bg-red-600 text-white align-middle ${className}`}>
      {badgeCount > 99 ? "99+" : badgeCount}
    </span>
  );
}
