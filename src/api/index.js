// src/api/index.js

// Pomocná funkce pro získání tokenu
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

// GET request
export async function apiGet(url) {
  const token = getToken();
  const fullUrl = url.startsWith("/api") ? url : `/api${url}`;

  const res = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
}

// POST request
export async function apiPost(url, body) {
  const token = getToken();
  const fullUrl = url.startsWith("/api") ? url : `/api${url}`;

  const res = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
}
