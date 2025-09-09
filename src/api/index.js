// 📁 /src/api/index.js

export async function apiPost(url, data, config = {}) {
  const res = await fetch(`/api${url}`, {
    method: "POST",
    body: data,
    ...config,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chyba při POST požadavku: ${res.status} – ${text}`);
  }

  return res.json();
}

// Pokud tam máš i další funkce:
export async function apiGet(url) {
  const res = await fetch(`/api${url}`);
  if (!res.ok) throw new Error("Chyba při GET požadavku");
  return res.json();
}

export async function apiJson(url, data, options = {}) {
  const res = await fetch(`/api${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(data),
    ...options,
  });
  if (!res.ok) throw new Error("Chyba při JSON požadavku");
  return res.json();
}
