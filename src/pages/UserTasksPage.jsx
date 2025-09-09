// src/pages/UserTasksPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiJson } from "../api";
import { useTasks } from "../context/TasksContext"; // ⬇️ pro refresh badge/kontextu

function getUserFromToken() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload?.user || payload || null;
  } catch {
    return null;
  }
}

export default function UserTasksPage() {
  const me = getUserFromToken();
  const myPharmacyCode = me?.pharmacyCode != null ? String(me.pharmacyCode) : null;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [tab, setTab] = useState("active");
  const [showCompletedInAll, setShowCompletedInAll] = useState(false);

  const tasksCtx = useTasks();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiGet("/tasks/my");
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json().catch(() => []);
      setTasks(Array.isArray(data) ? data : []);
      tasksCtx?.refresh?.();
    } catch (e) {
      console.error("fetchTasks error:", e);
      setBanner({ type: "error", msg: `Chyba při načítání úkolů: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myKeyFor = (t) => myPharmacyCode || (t.pharmacyCodes?.[0] || "");
  const isDone = (t) => !!t?.completions?.[myKeyFor(t)]?.done;

  const toggle = async (task) => {
    try {
      const key = myKeyFor(task);
      const doneNow = !(task?.completions?.[key]?.done);
      const { res, data } = await apiJson(`/tasks/${task._id}/complete`, {
        method: "PUT",
        body: { done: doneNow },
      });
      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      await fetchTasks();
      tasksCtx?.refresh?.();
    } catch (e) {
      console.error("toggle error:", e);
      setBanner({ type: "error", msg: `Nepodařilo se změnit stav: ${e.message}` });
    }
  };

  const fmtDate = (d) => {
    if (!d) return "Bez termínu";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "Bez termínu";
    return dt.toLocaleDateString("cs-CZ");
  };

  const sortedTasks = useMemo(() => {
    const ts = (x) => {
      const t = x?.dueDate ? new Date(x.dueDate).getTime() : Infinity;
      return Number.isFinite(t) ? t : Infinity;
    };
    return [...tasks].sort((a, b) => ts(a) - ts(b));
  }, [tasks]);

  const activeTasks = useMemo(() => sortedTasks.filter((t) => !isDone(t)), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter((t) => isDone(t)), [sortedTasks]);

  const visible = tab === "active" ? activeTasks : tab === "completed" ? completedTasks : sortedTasks;
  const isCompletedView = tab === "completed";

  return (
    <div className="p-6 space-y-4">
      {banner && (
        <div className="p-3 rounded-lg border bg-red-50 border-red-300 text-red-800 flex justify-between">
          <div className="text-sm">{banner.msg}</div>
          <button className="text-xs underline" onClick={() => setBanner(null)}>zavřít</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Moje úkoly</h1>
        <button onClick={fetchTasks} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm">Obnovit</button>
      </div>

      <div className="flex gap-2">
        {["active", "completed", "all"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg border ${tab === k ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
            title={k === "active" ? "Jen aktivní" : k === "completed" ? "Jen hotové" : "Vše"}
          >
            {k === "active" ? "Aktivní" : k === "completed" ? "Hotové" : "Vše"}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Načítám…</div>
      ) : (
        <>
          {tab !== "all" && (
            <div className="space-y-3">
              {visible.map((t) => {
                const key = myKeyFor(t);
                const done = !!t?.completions?.[key]?.done;
                return (
                  <div key={t._id} className={`flex items-start gap-12 p-4 rounded-xl border${isCompletedView ? " bg-gray-50" : ""}`}>
                    <input type="checkbox" checked={done} onChange={() => toggle(t)} style={{ width: 18, height: 18, marginTop: 6 }} />
                    <div className="flex-1">
                      <div className={`font-medium${isCompletedView ? " line-through" : ""}`}>{t.title}</div>
                      {t.description && <div className={`text-sm opacity-80${isCompletedView ? " line-through" : ""}`}>{t.description}</div>}
                      <div className="text-xs mt-1">Termín: {fmtDate(t.dueDate)}</div>
                    </div>
                    <button onClick={() => toggle(t)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
                      {done ? "Vrátit na nesplněno" : "Označit splněno"}
                    </button>
                  </div>
                );
              })}
              {visible.length === 0 && <div className="text-sm opacity-80">Nic k zobrazení.</div>}
            </div>
          )}

          {tab === "all" && (
            <>
              <div className="space-y-3">
                {activeTasks.map((t) => {
                  const key = myKeyFor(t);
                  const done = !!t?.completions?.[key]?.done;
                  return (
                    <div key={t._id} className="flex items-start gap-12 p-4 rounded-xl border">
                      <input type="checkbox" checked={done} onChange={() => toggle(t)} style={{ width: 18, height: 18, marginTop: 6 }} />
                      <div className="flex-1">
                        <div className="font-medium">{t.title}</div>
                        {t.description && <div className="text-sm opacity-80">{t.description}</div>}
                        <div className="text-xs mt-1">Termín: {fmtDate(t.dueDate)}</div>
                      </div>
                      <button onClick={() => toggle(t)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Označit splněno</button>
                    </div>
                  );
                })}
                {activeTasks.length === 0 && <div className="text-sm opacity-80">Žádné aktivní úkoly.</div>}
              </div>

              <div className="my-6 border-t" />

              <div className="flex items-center justify-between">
                <div className="font-medium">Hotové ({completedTasks.length})</div>
                <button className="text-sm underline" onClick={() => setShowCompletedInAll((v) => !v)}>
                  {showCompletedInAll ? "skrýt" : "zobrazit"}
                </button>
              </div>

              {showCompletedInAll && (
                <div className="mt-2 space-y-3">
                  {completedTasks.map((t) => {
                    const key = myKeyFor(t);
                    const doneAt = t?.completions?.[key]?.doneAt;
                    return (
                      <div key={t._id} className="flex items-start gap-12 p-4 rounded-xl border bg-gray-50">
                        <input type="checkbox" checked readOnly style={{ width: 18, height: 18, marginTop: 6 }} />
                        <div className="flex-1">
                          <div className="font-medium line-through">{t.title}</div>
                          {t.description && <div className="text-sm opacity-80 line-through">{t.description}</div>}
                          <div className="text-xs mt-1">Termín: {fmtDate(t.dueDate)} · Splněno: {doneAt ? new Date(doneAt).toLocaleString("cs-CZ") : "-"}</div>
                        </div>
                        <button onClick={() => toggle(t)} className="px-3 py-2 rounded-lg border">Vrátit na nesplněno</button>
                      </div>
                    );
                  })}
                  {completedTasks.length === 0 && <div className="text-sm opacity-80">Žádné hotové úkoly.</div>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}