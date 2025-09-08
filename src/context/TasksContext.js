import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet } from "../api";

// stejně jako v UserTasksPage
function getUserFromToken() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload?.user || payload || null;
  } catch { return null; }
}

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const me = getUserFromToken();
  const myPharmacyCode = me?.pharmacyCode != null ? String(me.pharmacyCode) : null;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet("/tasks/my");          // ⬅️ používá token
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const myKeyFor = (t) => myPharmacyCode || (t.pharmacyCodes?.[0] || "");
  const isDone   = (t) => !!t?.completions?.[myKeyFor(t)]?.done;

  const todayKey = new Date().toISOString().slice(0,10);
  const ts = (x) => {
    const t = x?.dueDate ? new Date(x.dueDate).getTime() : Infinity;
    return Number.isFinite(t) ? t : Infinity;
  };

  const computed = useMemo(() => {
    const openTasks   = tasks.filter((t) => !isDone(t));
    const todayTasks  = openTasks.filter((t) => (t.dueDate || "").slice(0,10) === todayKey);
    const upcoming    = openTasks.filter((t) => (t.dueDate || "").slice(0,10) !== todayKey).sort((a,b)=>ts(a)-ts(b));
    const nextDueTask = [...openTasks].map(t => ({...t, _ts: ts(t)})).sort((a,b)=>a._ts-b._ts)[0];
    return {
      openTasks,
      todayTasks,
      upcoming,
      badgeCount: openTasks.length,                   // 👈 počet otevřených
      nextDueTask: nextDueTask && nextDueTask._ts !== Infinity ? nextDueTask : null,
    };
  }, [tasks, todayKey]); // eslint-disable-line

  return (
    <TasksContext.Provider value={{ tasks, setTasks, loading, error, refresh: fetchTasks, ...computed }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(){ 
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within <TasksProvider>");
  return ctx;
}
