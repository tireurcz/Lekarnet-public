// src/pages/AdminTasksPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiJson } from "../api";
import { useTasks } from "../context/TasksContext"; // ⬅️ kvůli refresh badge/kontextu

function Banner({ type = "info", children, onClose }) {
  const base =
    type === "error"
      ? "bg-red-50 border-red-300 text-red-800"
      : type === "success"
      ? "bg-green-50 border-green-300 text-green-800"
      : "bg-blue-50 border-blue-300 text-blue-800";
  return (
    <div className={`p-3 rounded-lg border ${base} flex items-start justify-between gap-4`}>
      <div className="text-sm">{children}</div>
      {onClose && (
        <button className="text-xs underline underline-offset-2" onClick={onClose} title="Zavřít">
          zavřít
        </button>
      )}
    </div>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-5 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-semibold mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState("");
  const [pharmacyCode, setPharmacyCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("open"); // all | open | archived
  const [open, setOpen] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [codesCsv, setCodesCsv] = useState("");

  // UI stav
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [banner, setBanner] = useState(null); // {type, msg}
  const [modalError, setModalError] = useState("");

  // ⬇️ Tasks kontext (může být null, kdyby stránka běžela mimo provider)
  const tasksCtx = (() => {
    try {
      return useTasks();
    } catch {
      return null;
    }
  })();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (pharmacyCode.trim()) params.set("pharmacyCode", pharmacyCode.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const url = `/tasks?${params.toString()}`;
      const res = await apiGet(url);

      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.error) errText = j.error;
        } catch {}
        throw new Error(errText);
      }

      const data = await res.json().catch(() => []);
      setTasks(Array.isArray(data) ? data : []);
      // po načtení (např. změna filtru) zkus také refreshnout badge
      tasksCtx?.refresh?.();
    } catch (e) {
      console.error("fetchTasks error:", e);
      setBanner({ type: "error", msg: `Chyba při načítání úkolů: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, [statusFilter]);

  const fmtDate = (d) => {
    if (!d) return "Bez termínu";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "Bez termínu";
    return dt.toLocaleDateString("cs-CZ");
  };

  const createTask = async () => {
    try {
      setCreating(true);
      setModalError("");

      const cleanCodes = codesCsv
        .split(",")
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0);

      if (!title.trim()) {
        setModalError("Název je povinný.");
        setCreating(false);
        return;
      }
      if (cleanCodes.length === 0) {
        setModalError("Zadej alespoň jeden pharmacyCode (CSV).");
        setCreating(false);
        return;
      }

      const body = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        pharmacyCodes: cleanCodes,
      };

      const { res, data } = await apiJson("/tasks", { method: "POST", body });

      if (!res.ok) {
        const msg = data?.error || `Úkol se nepodařilo vytvořit (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setOpen(false);
      setTitle(""); setDescription(""); setDueDate(""); setCodesCsv("");
      setQ(""); setPharmacyCode("");
      setStatusFilter("open"); // po vytvoření ukaž default
      setBanner({ type: "success", msg: "Úkol byl vytvořen." });
      await fetchTasks();
      tasksCtx?.refresh?.(); // ⬅️ přepočítej badge
    } catch (e) {
      console.error("createTask error:", e);
      setModalError(e.message || "Úkol se nepodařilo vytvořit.");
    } finally {
      setCreating(false);
    }
  };

  const archive = async (id) => {
    try {
      const { res, data } = await apiJson(`/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setBanner({ type: "success", msg: "Úkol byl archivován." });
      await fetchTasks();
      tasksCtx?.refresh?.(); // ⬅️ přepočítej badge
    } catch (e) {
      console.error("archive error:", e);
      setBanner({ type: "error", msg: `Archivace selhala: ${e.message}` });
    }
  };

  // seřazení: nejbližší termín nahoru (bez termínu až nakonec)
  const sortedTasks = useMemo(() => {
    const ts = (x) => {
      const t = x?.dueDate ? new Date(x.dueDate).getTime() : Infinity;
      return Number.isFinite(t) ? t : Infinity;
    };
    return [...tasks].sort((a, b) => ts(a) - ts(b));
  }, [tasks]);

  return (
    <div className="p-6 space-y-4">
      {banner && (
        <Banner type={banner.type} onClose={() => setBanner(null)}>
          {banner.msg}
        </Banner>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Správa úkolů</h1>
        <button
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          onClick={() => { setModalError(""); setOpen(true); }}
        >
          + Nový úkol
        </button>
      </div>

      {/* rychlé filtry stavu */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Vše" },
          { key: "open", label: "Otevřené" },
          { key: "archived", label: "Archivované" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg border ${statusFilter === key ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          placeholder="Hledat v názvu…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 rounded-lg border"
        />
        <input
          placeholder="Filtrovat podle pharmacyCode…"
          value={pharmacyCode}
          onChange={(e) => setPharmacyCode(e.target.value)}
          className="px-3 py-2 rounded-lg border"
        />
        <button
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          onClick={fetchTasks}
          disabled={loading}
        >
          {loading ? "Načítám…" : "Filtrovat"}
        </button>
      </div>

      <div className="grid gap-3">
        {sortedTasks.map((t) => (
          <div key={t._id} className="p-4 rounded-xl border">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="font-medium">{t.title}</div>
                {t.description ? <div className="text-sm opacity-80">{t.description}</div> : null}
                <div className="text-xs mt-1">
                  {t.dueDate ? `Termín: ${fmtDate(t.dueDate)}` : "Bez termínu"} · Cíl:{" "}
                  {(t.pharmacyCodes || []).join(", ") || "—"} · Stav: {t.status}
                </div>
              </div>
              <div className="flex-shrink-0">
                {t.status !== "archived" ? (
                  <button
                    className="px-3 py-2 rounded-lg border border-red-300 hover:bg-red-50"
                    onClick={() => archive(t._id)}
                  >
                    Archivovat
                  </button>
                ) : (
                  <span className="text-xs px-2 py-1 rounded border bg-gray-50">Archivováno</span>
                )}
              </div>
            </div>

            {t.completions && (
              <div className="mt-3 text-sm">
                <div className="font-medium mb-1">Progres:</div>
                <ul className="list-disc ml-5">
                  {Object.entries(t.completions).map(([key, val]) => (
                    <li key={key}>
                      {key}: {val?.done
                        ? `splněno ${val?.doneAt ? new Date(val.doneAt).toLocaleString("cs-CZ") : ""}`
                        : "nesplněno"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {!loading && sortedTasks.length === 0 && (
          <div className="text-sm opacity-80">Žádné úkoly k zobrazení.</div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nový úkol">
        <div className="space-y-3">
          <input
            placeholder="Název"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />
          <input
            placeholder="Popis"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />
          <input
            placeholder="Pharmacy codes (CSV) – např. 64, 71"
            value={codesCsv}
            onChange={(e) => setCodesCsv(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />

          {modalError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-300 p-2 rounded">
              {modalError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg border" disabled={creating}>
              Zrušit
            </button>
            <button
              onClick={createTask}
              disabled={creating || !title.trim()}
              className="px-3 py-2 rounded-lg border bg-gray-900 text-white"
            >
              {creating ? "Vytvářím…" : "Vytvořit"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
