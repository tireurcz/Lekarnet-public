// src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function authHeader() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(method, path, body = null, opts = {}) {
  const res = await fetch(
    path.startsWith("http") ? path : `${API_BASE}${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(opts.headers || {}),
      },
      body: body != null ? JSON.stringify(body) : null,
      ...opts,
    }
  );

  // volitelně: ošetření 204
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Původní alias — pokud už v projektu používáš apiJson(method, ...), ať se nic nerozbije
export const apiJson = (method, path, body, opts) =>
  apiRequest(method, path, body, opts);

// Pohodlné zkratky (vč. apiPost, která ti chybí)
export const apiGet = (path, opts) => apiRequest("GET", path, null, opts);
export const apiPost = (path, body, opts) => apiRequest("POST", path, body, opts);
export const apiPut = (path, body, opts) => apiRequest("PUT", path, body, opts);
export const apiPatch = (path, body, opts) => apiRequest("PATCH", path, body, opts);
export const apiDelete = (path, opts) => apiRequest("DELETE", path, null, opts);
