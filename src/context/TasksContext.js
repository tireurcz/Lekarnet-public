// src/context/TasksContext.js
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api";

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);         // vždy pole
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ⬇️ uprav cestu podle svého backendu; pokud zatím nemáš endpoint, nech /api/tasks
      const data = await apiGet("/api/tasks").catch((err) => {
        // když backend zatím endpoint nemá → 404 = žádné úkoly
        if (String(err.message).includes("404")) return [];
        throw err;
      });
      setTasks(Array.isArray(data) ? data : []); // jistota pole
    } catch (err) {
      setError(err.message || "Neznámá chyba");
      // nezpůsobíme pád UI: necháme klidně poslední známé tasks, nebo prázdno
      setTasks((prev) => (Array.isArray(prev) ? prev : []));
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback(async (payload) => {
    const created = await apiPost("/api/tasks", payload);
    setTasks((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    const updated = await apiPatch(`/api/tasks/${id}`, patch);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    return updated;
  }, []);

  const completeTask = useCallback(async (id) => {
    const updated = await apiPatch(`/api/tasks/${id}`, { completed: true });
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await apiDelete(`/api/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const value = useMemo(
    () => ({
      tasks, loading, error,
      fetchTasks, addTask, updateTask, completeTask, deleteTask,
    }),
    [tasks, loading, error, fetchTasks, addTask, updateTask, completeTask, deleteTask]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within <TasksProvider>");
  return ctx;
}
