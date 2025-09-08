import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const TasksContext = createContext(null);

export function TasksProvider({ children, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Try backend endpoint; fall back to mock data if it fails
      const res = await fetch(`/api/tasks?assignedTo=${encodeURIComponent(user?.id || user?._id || "me")}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data?.tasks || []);
    } catch (e) {
      console.warn("Tasks API not available, using mock data.", e);
      // --- Mock sample so UI works immediately ---
      setTasks([
        { id: "t1", title: "Zkontrolovat expirace - LIDL", dueDate: new Date().toISOString(), status: "open", priority: "high" },
        { id: "t2", title: "Odeslat měsíční report HRANÍK", dueDate: new Date(Date.now() + 1000*60*60*24).toISOString(), status: "in_progress", priority: "medium" },
        { id: "t3", title: "Schválit převody mezi pobočkami", dueDate: new Date(Date.now() + 1000*60*60*48).toISOString(), status: "open", priority: "low" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const todayKey = new Date().toISOString().slice(0,10); // YYYY-MM-DD

  const computed = useMemo(() => {
    const isOpen = (t) => t.status === "open" || t.status === "in_progress";
    const openTasks = tasks.filter(isOpen);
    const todayTasks = openTasks.filter(t => (t.dueDate || "").slice(0,10) === todayKey);

    const nextDue = openTasks
      .map(t => ({ ...t, ts: t.dueDate ? new Date(t.dueDate).getTime() : Infinity }))
      .sort((a,b) => a.ts - b.ts)[0];

    return {
      openTasks,
      todayTasks,
      badgeCount: openTasks.length,
      nextDueTask: nextDue && nextDue.ts !== Infinity ? nextDue : null,
    };
  }, [tasks, todayKey]);

  const value = useMemo(() => ({
    tasks,
    setTasks,
    loading,
    error,
    refresh: fetchTasks,
    ...computed,
  }), [tasks, loading, error, fetchTasks, computed]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(){
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within <TasksProvider>");
  return ctx;
}