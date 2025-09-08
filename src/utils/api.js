// src/utils/api.js
import axios from "axios";

function ensureApiSuffix(raw) {
  if (!raw) return "/api"; // fallback (proxy)
  return raw.endsWith("/api")
    ? raw
    : raw.endsWith("/")
    ? raw + "api"
    : raw + "/api";
}

// 1) Primárně z CRA env
const envBase = (process.env.REACT_APP_API_BASE_URL || "").trim();

// 2) Když env chybí a jsme na CRA dev serveru (3000), použij přímo backend 5000
const inferredBase =
  (!envBase && typeof window !== "undefined" && window.location.hostname === "localhost" && window.location.port === "3000")
    ? "http://localhost:5000/api"
    : "";

// 3) Finální baseURL
const baseURL = ensureApiSuffix(envBase || inferredBase || "");

// Debug (klidně si nech viditelný, ať víš, kam to volá)
console.log("[API] baseURL =", baseURL, "| REACT_APP_API_BASE_URL =", process.env.REACT_APP_API_BASE_URL || "(none)");

const API = axios.create({
  baseURL,
  withCredentials: false,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
