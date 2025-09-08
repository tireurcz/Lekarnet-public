// src/pages/AdminUsersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/api";
import {
  Search,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const LIMIT = 10;

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null); // { ...user }
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ok, setOk] = useState("");

  // debounce vyhledávání
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  // načtení listu
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/admin/users", {
          params: { q: debouncedQ, page, limit: LIMIT },
        });
        setRows(res?.data?.users || []);
        setTotal(res?.data?.total || 0);
      } catch (e) {
        setError(e?.response?.data?.message || "Nepodařilo se načíst seznam uživatelů.");
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedQ, page]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError("");
    setOk("");
    try {
      const res = await API.get(`/admin/users/${id}`);
      setSelected(res?.data?.user || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Nepodařilo se načíst detail uživatele.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setSaving(false);
    setDeleting(false);
    setOk("");
  };

  const saveAdminFields = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setError("");
    setOk("");
    try {
      const payload = {
        role: selected.role,
        pharmacyCode:
          selected.pharmacyCode === "" || selected.pharmacyCode === null
            ? ""
            : String(selected.pharmacyCode),
      };
      const res = await API.patch(`/admin/users/${selected._id}`, payload);
      setOk("Změny uloženy.");

      // refresh řádku v tabulce
      const updated = res?.data?.user;
      setRows((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
      setSelected((prev) => ({ ...(prev || {}), ...(updated || {}) }));
    } catch (e) {
      setError(e?.response?.data?.message || "Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!selected?._id) return;
    if (!window.confirm("Opravdu smazat tohoto uživatele?")) return;

    setDeleting(true);
    setError("");
    setOk("");
    try {
      await API.delete(`/admin/users/${selected._id}`);
      setOk("Uživatel byl smazán.");
      // odstranit z listu
      setRows((prev) => prev.filter((r) => r._id !== selected._id));
      setTotal((t) => Math.max(0, t - 1));
      closeDetail();
    } catch (e) {
      setError(e?.response?.data?.message || "Smazání se nezdařilo.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Uživatelé</h1>
        <span className="ml-auto text-sm text-gray-500">
          Nalezeno: {total} • Stránka {page}/{pageCount}
        </span>
      </header>

      {/* vyhledávání */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white w-full max-w-md">
          <Search size={18} className="opacity-60" />
          <input
            placeholder="Hledat podle username nebo emailu…"
            className="w-full outline-none"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
      </div>

      {/* stav */}
      {error && <div className="mb-3 p-3 rounded bg-red-50 text-red-700">{error}</div>}
      {ok && <div className="mb-3 p-3 rounded bg-green-50 text-green-700">{ok}</div>}

      {/* tabulka */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-3 text-gray-600">
              <th>Uživatel</th>
              <th>Email</th>
              <th className="whitespace-nowrap">Role</th>
              <th className="whitespace-nowrap">Kód pobočky</th>
              <th>Vytvořen</th>
              <th className="w-40">Akce</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Načítám…
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Nic nenalezeno.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
                        u.role === "admin"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role === "admin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.pharmacyCode ?? ""}</td>
                  <td className="px-4 py-3">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(u._id)}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50"
                        title="Upravit"
                      >
                        <Pencil size={16} /> Upravit
                      </button>
                      <button
                        onClick={() => {
                          setSelected(u);
                          deleteUser();
                        }}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-red-50 text-red-700 border-red-200"
                        title="Smazat"
                      >
                        <Trash2 size={16} /> Smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* stránkování */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft size={16} /> Předchozí
        </button>
        <span className="text-sm text-gray-600">
          {page} / {pageCount}
        </span>
        <button
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page >= pageCount || loading}
        >
          Další <ChevronRight size={16} />
        </button>
      </div>

      {/* modal detailu */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">Uživatel: {selected.username}</h3>
              <button onClick={closeDetail} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {detailLoading ? (
                <div className="text-gray-500">Načítám detail…</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Email</label>
                      <input className="w-full border rounded px-3 py-2 bg-gray-100" value={selected.email || ""} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Username</label>
                      <input className="w-full border rounded px-3 py-2 bg-gray-100" value={selected.username || ""} readOnly />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Role</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={selected.role || "user"}
                        onChange={(e) => setSelected((s) => ({ ...s, role: e.target.value }))}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kód pobočky</label>
                      <input
                        className="w-full border rounded px-3 py-2"
                        value={selected.pharmacyCode ?? ""}
                        onChange={(e) => setSelected((s) => ({ ...s, pharmacyCode: e.target.value }))}
                        placeholder="např. 0012 (prázdné = none)"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Změny v této sekci jsou <b>admin-only</b> a projeví se ihned po uložení.
                  </div>

                  {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
                  {ok && <div className="p-2 rounded bg-green-50 text-green-700 text-sm">{ok}</div>}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button
                onClick={closeDetail}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Zavřít
              </button>
              <button
                onClick={saveAdminFields}
                disabled={saving || detailLoading}
                className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Ukládám…" : "Uložit změny"}
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting || detailLoading}
                className="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Mažu…" : "Smazat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
