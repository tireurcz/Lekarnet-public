// src/components/TasksWidget.jsx
import React from "react";
import { useTasks } from "../context/TasksContext";
import { Link } from "react-router-dom";

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr || "";
  }
}

export default function TasksWidget() {
  const { todayTasks, upcoming, nextDueTask, loading, error, refresh } = useTasks();
  const showFallback = !loading && todayTasks.length === 0 && upcoming.length > 0;
  const list = showFallback ? upcoming.slice(0, 5) : todayTasks.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          {showFallback ? "Nejbližší úkoly" : "Dnešní úkoly"}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="text-sm px-2.5 py-1 rounded-lg border hover:bg-gray-50">
            Obnovit
          </button>
          <Link to="/tasks" className="text-sm px-2.5 py-1 rounded-lg bg-gray-900 text-white hover:bg-black">
            Všechny úkoly
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Načítám úkoly…</p>}
      {error && <p className="text-sm text-red-600">Chyba při načítání úkolů.</p>}

      {!loading && list.length === 0 && (
        <div className="text-sm text-gray-600">
          Dnes nemáš žádné otevřené úkoly. 🎉
          {nextDueTask && (
            <div className="mt-2 text-gray-500">
              Nejbližší termín: <strong>{formatDate(nextDueTask.dueDate)}</strong> — {nextDueTask.title}
            </div>
          )}
        </div>
      )}

      {!loading && list.length > 0 && (
        <ul className="divide-y">
          {list.map((t) => (
            <li key={t._id || t.id} className="py-2 flex items-start gap-3">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div className="flex-1">
                <div className="text-sm font-medium leading-snug">{t.title}</div>
                <div className="text-xs text-gray-500">Do: {formatDate(t.dueDate)}</div>
              </div>
              <Link to="/tasks" className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50">
                Otevřít
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
