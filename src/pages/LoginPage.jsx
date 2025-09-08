// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";

const LoginPage = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      console.log("[LOGIN] Odesílám /auth/login na:", (API.defaults.baseURL || "") + "/auth/login");
      const res = await API.post("/auth/login", form);
      console.log("[LOGIN] /auth/login status:", res?.status, "payload:", res?.data);

      const token =
        res?.data?.token ||
        res?.data?.accessToken ||
        res?.data?.data?.token;

      const roleFromLogin =
        res?.data?.user?.role ||
        res?.data?.role ||
        res?.data?.data?.role;

      if (!token) throw new Error("Token není v odpovědi /auth/login");

      localStorage.setItem("token", token);
      if (roleFromLogin) localStorage.setItem("userRole", roleFromLogin);

      console.log("[LOGIN] token uložen (prvních 20 znaků):", String(token).slice(0, 20) + "...");
      console.log("[LOGIN] roleFromLogin:", roleFromLogin || "(nepřišla)");

      console.log("[LOGIN] Volám /protected/me na:", (API.defaults.baseURL || "") + "/protected/me");
      const verify = await API.get("/protected/me");
      console.log("[LOGIN] /protected/me status:", verify?.status, "payload:", verify?.data);

      const verifiedRole =
        verify?.data?.user?.role ||
        verify?.data?.role ||
        localStorage.getItem("userRole") ||
        "user";

      localStorage.setItem("userRole", verifiedRole);

      const username = verify?.data?.user?.username ?? null;
      const pharmacyCode = verify?.data?.user?.pharmacyCode ?? null;
      if (username) localStorage.setItem("username", username);
      if (pharmacyCode !== null && pharmacyCode !== undefined) {
        localStorage.setItem("pharmacyCode", String(pharmacyCode));
      }

      console.log("[LOGIN] verifiedRole =", verifiedRole, "| username =", username, "| pharmacyCode =", pharmacyCode);

      // 3) redirect – vezmi 'from' jen pokud odpovídá roli
      const from = location.state?.from || null;
      if (from) {
        const canUseFrom =
          (verifiedRole === "admin" && from.startsWith("/admin")) ||
          (verifiedRole === "user" && from.startsWith("/user")) ||
          (from.startsWith("/pharmacy")); // tu mají obě role

        if (canUseFrom) {
          console.log("[LOGIN] Přesměrovávám zpět na původní trasu:", from);
          navigate(from, { replace: true });
          return;
        }
      }

      if (verifiedRole === "admin") {
        console.log("[LOGIN] Přesměrovávám na /admin/dashboard");
        navigate("/admin/dashboard", { replace: true });
      } else {
        console.log("[LOGIN] Přesměrovávám na /user/dashboard");
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      console.error(
        "❌ Chyba při přihlášení/ověření:",
        err?.response?.status,
        err?.response?.data || err?.message || err
      );
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("pharmacyCode");

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Neplatné přihlašovací údaje nebo server nedostupný."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Přihlášení</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Uživatelské jméno"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Heslo"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
