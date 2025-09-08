// src/context/TasksContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api";

function parseDate(d) {
  if (!d) return null;
  const t = typeof d === "string" ? Date.parse(d) : +d;
  return Number.isFinite(t) ? new Date(t) : null;
}
function isOverdue(task) {
  const due = parseDate(task?.dueAt || task?.dueDate);
  if (!due) return false;
  return !task?.completed && due.getTime() < Date.now();
}
function byIdMap(list) {
  const m = new Map();
  (list || []).forEach((t) => m.set(String(t._id || t.id), t));
  return m;
}

const TasksContext = createContext(null);
export const useTasks = () => useContext(TasksContext);

export function TasksProvider({ user, children }) {
  const [tasks, setTasks] = useState([]);
  const [byId, setById] = useState(() => new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadMyTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/tasks/my"); // helper přidá /api a token
      console.log("[TASKS] GET /tasks/my →", res.status, res.ok, res.error);
      if (res.ok && Array.isArray(res.items)) {
        setTasks(res.items);
        setById(byIdMap(res.items));
      } else {
        setTasks([]);
        setById(new Map());
      }
    } catch (e) {
      console.error("[TASKS] loadMyTasks error:", e);
      setError(String(e));
      setTasks([]);
      setById(new Map());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyTasks();
  }, [user?.id]);

  async function addTask(payload) {
    const res = await apiPost("/tasks", payload);
    if (!res.ok || !res.item) {
      throw new Error(res.error || "Nepodařilo se vytvořit úkol");
    }
    const next = [...tasks, res.item];
    setTasks(next);
    setById(byIdMap(next));
    return res.item;
  }

  async function updateTask(id, patch) {
    const _id = String(id);
    const prev = byId.get(_id);
    if (!prev) return null;

    const optimistic = { ...prev, ...patch };
    const nextList = tasks.map((t) => (String(t._id || t.id) === _id ? optimistic : t));
    setTasks(nextList);
    setById(byIdMap(nextList));

    const res = await apiPost(`/tasks/${_id}?_method=PATCH`, patch);
    if (!res.ok || !res.item) {
      // revert
      const reverted = tasks.map((t) => (String(t._id || t.id) === _id ? prev : t));
      setTasks(reverted);
      setById(byIdMap(reverted));
      throw new Error(res.error || "Nepodařilo se upravit úkol");
    }
    const fixed = tasks.map((t) => (String(t._id || t.id) === _id ? res.item : t));
    setTasks(fixed);
    setById(byIdMap(fixed));
    return res.item;
  }

  async function completeTask(id, completed = true) {
    const _id = String(id);
    const prev = byId.get(_id);
    if (!prev) return null;

    const optimistic = { ...prev, completed: !!completed };
    const tmp = tasks.map((t) => (String(t._id || t.id) === _id ? optimistic : t));
    setTasks(tmp);
    setById(byIdMap(tmp));

    const res = await apiPost(`/tasks/${_id}/complete`, { completed: !!completed });
    if (!res.ok || !res.item) {
      // revert
      const reverted = tasks.map((t) => (String(t._id || t.id) === _id ? prev : t));
      setTasks(reverted);
      setById(byIdMap(reverted));
      throw new Error(res.error || "Nepodařilo se změnit stav úkolu");
    }
    const fixed = tasks.map((t) => (String(t._id || t.id) === _id ? res.item : t));
    setTasks(fixed);
    setById(byIdMap(fixed));
    return res.item;
  }

  async function deleteTask(id) {
    const _id = String(id);
    const prev = byId.get(_id);
    if (!prev) return false;

    const kept = tasks.filter((t) => String(t._id || t.id) !== _id);
    setTasks(kept);
    setById(byIdMap(kept));

    const res = await apiPost(`/tasks/${_id}?_method=DELETE`, {});
    if (!res.ok) {
      // revert
      const reverted = [...kept, prev];
      setTasks(reverted);
      setById(byIdMap(reverted));
      throw new Error(res.error || "Nepodařilo se smazat úkol");
    }
    return true;
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const open = tasks.filter((t) => !t.completed).length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    return { total, open, overdue };
  }, [tasks]);

  const value = useMemo(
    () => ({
      tasks,
      byId,
      loading,
      error,
      stats,
      reloadTasks: loadMyTasks,
      addTask,
      updateTask,
      completeTask,
      deleteTask,
    }),
    [tasks, byId, loading, error, stats]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
