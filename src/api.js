// src/api.js
// CRA: používáme process.env.REACT_APP_API_URL
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Získání tokenu (uprav, pokud ho ukládáš jinam)
function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    null
  );
}

// GET helper – přidá Authorization, NEpoužívá cookies
export function apiGet(path, opts = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE}${path}`, {
    ...opts,
    method: opts.method || "GET",
    headers,
  });
}

// JSON helper – pro POST/PUT/DELETE/GET s JSONem
export async function apiJson(path, { method = "GET", body, headers, ...rest } = {}) {
  const token = getToken();
  const hdrs = new Headers(headers || {});
  hdrs.set("Content-Type", "application/json");
  if (token) hdrs.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: hdrs,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // Přečti JSON jen když server pošle JSON
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch { data = null; }
  }

  return { res, data };
}
