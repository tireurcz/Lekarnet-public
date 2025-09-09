// 📁 frontend/src/utils/auth.js
export function getUserFromToken() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token") || null;
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
