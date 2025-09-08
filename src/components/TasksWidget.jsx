// src/components/TasksWidget.jsx
import { useEffect } from "react";
import { useTasks } from "../context/TasksContext";

export default function TasksWidget() {
  const { tasks, loading, error, fetchTasks } = useTasks();

  useEffect(() => {
    // načti jednou po mountu
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const done = list.filter((t) => t?.completed).length;
  const pending = total - done;

  return (
    <div className="rounded-2xl shadow p-4">
      <h3 className="font-semibold text-lg mb-2">Úkoly</h3>

      {loading && <div>Načítám…</div>}

      {!loading && error && !String(error).includes("404") && (
        <div className="text-sm text-red-600">Chyba: {String(error)}</div>
      )}

      {!loading && !error && total === 0 && (
        <div className="text-sm text-gray-500">Žádné úkoly.</div>
      )}

      {!loading && total > 0 && (
        <ul className="text-sm list-disc pl-5 space-y-1 max-h-60 overflow-auto">
          {list.slice(0, 5).map((t) => (
            <li key={t._id || t.id}>
              <span className={t?.completed ? "line-through text-gray-500" : ""}>
                {t?.title || "(bez názvu)"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-xs text-gray-600">
        Celkem: {total} · Hotovo: {done} · Zbývá: {pending}
      </div>
    </div>
  );
}
