// src/api/index.js

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    null
  );
}

function buildUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;      // absolutní URL
  if (url.startsWith("/api/")) return url;        // už má /api
  if (url.startsWith("/")) return `/api${url}`;   // relativní s lomítkem
  return `/api/${url}`;                           // relativní bez lomítka
}

export async function apiJson(url, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const fullUrl = buildUrl(url);

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // 204 apod. – bez těla
  }
  return { status: res.status, ok: res.ok, ...data };
}

export function apiGet(url) {
  return apiJson(url, { method: "GET" });
}
export function apiPost(url, body) {
  return apiJson(url, { method: "POST", body });
}
export function apiPatch(url, body) {
  return apiJson(url, { method: "PATCH", body });
}
export function apiDelete(url, body) {
  return apiJson(url, { method: "DELETE", body });
}
