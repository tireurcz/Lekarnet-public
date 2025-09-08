// src/pages/PharmacyInventoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../utils/api";

export default function PharmacyInventoryPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await API.get("/pharmacy/inventory"); // backend vrátí položky pro přihlášenou pobočku
        setRows(res.data || []);
      } catch (e) {
        console.error(e);
        setErr("Nepodařilo se načíst sklad pobočky.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = rows;
    if (term) {
      out = out.filter(
        r =>
          String(r.code).toLowerCase().includes(term) ||
          String(r.name).toLowerCase().includes(term)
      );
    }
    out = [...out].sort((a, b) => {
      const A = a[sort.key];
      const B = b[sort.key];
      if (A === B) return 0;
      const res = A > B ? 1 : -1;
      return sort.dir === "asc" ? res : -res;
    });
    return out;
  }, [rows, q, sort]);

  const totals = useMemo(() => {
    const cnt = filtered.length;
    const sumStock = filtered.reduce((s, r) => s + (Number(r.stock) || 0), 0);
    const need = filtered.filter(r => r.minStock != null && r.stock < r.minStock);
    const deficitSum = need.reduce((s, r) => s + (r.minStock - r.stock), 0);
    return { cnt, sumStock, needCnt: need.length, deficitSum };
  }, [filtered]);

  const toggleSort = (key) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-900">Sklad pobočky</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat kód / název…"
          className="border border-blue-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="mb-3 flex gap-3 text-sm">
        <Badge>Množství: <strong>{totals.sumStock}</strong></Badge>
        <Badge>Položky: <strong>{totals.cnt}</strong></Badge>
        <Badge>Pod minimem: <strong>{totals.needCnt}</strong></Badge>
        <Badge>Deficit ks: <strong>{totals.deficitSum}</strong></Badge>
      </div>

      {loading ? (
        <div className="p-6">Načítání…</div>
      ) : err ? (
        <div className="p-6 text-red-600">{err}</div>
      ) : (
        <div className="overflow-auto rounded-lg border border-blue-100">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50 text-blue-900">
              <tr>
                <Th onClick={() => toggleSort("code")} label="Kód" active={sort.key === "code"} dir={sort.dir} />
                <Th onClick={() => toggleSort("name")} label="Název" active={sort.key === "name"} dir={sort.dir} />
                <Th onClick={() => toggleSort("stock")} label="Sklad" active={sort.key === "stock"} dir={sort.dir} right />
                <Th onClick={() => toggleSort("minStock")} label="Min." active={sort.key === "minStock"} dir={sort.dir} right />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const low = r.minStock != null && r.stock < r.minStock;
                return (
                  <tr key={idx} className={`border-b last:border-b-0 ${low ? "bg-amber-50/60" : "hover:bg-blue-50/40"}`}>
                    <td className="px-3 py-2">{r.code}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.stock}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.minStock ?? "-"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-blue-800">
                    Nic nenalezeno
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ label, onClick, active, dir, right }) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 font-semibold ${right ? "text-right" : "text-left"} cursor-pointer select-none`}
      title="Seřadit"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <span>{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}
function Badge({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-900">
      {children}
    </span>
  );
}
