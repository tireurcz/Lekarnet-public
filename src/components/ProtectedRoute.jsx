// src/components/ProtectedRoute.jsx
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import API from "../utils/api";

export default function ProtectedRoute({ children, roles }) {
  // status: 'loading' | 'ok' | 'redirect'
  const [status, setStatus] = useState("loading");
  const [redirectTo, setRedirectTo] = useState(null);
  const location = useLocation();
  const abortRef = useRef(null);

  useEffect(() => {
    const verify = async () => {
      // Zruš předchozí request při re-mountu / změně cesty
      if (abortRef.current) abortRef.current.abort();

      const token = localStorage.getItem("token");
      if (!token) {
        setRedirectTo("/login");
        setStatus("redirect");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // /protected/me je autoritativní zdroj identity i role
        const res = await API.get("/protected/me", { signal: controller.signal });

        // role je v data.user.role – s fallbackem na "user"
        const role =
          typeof res?.data?.user?.role === "string" && res.data.user.role.trim()
            ? res.data.user.role.trim()
            : "user";

        // pokud je komponenta použita s omezením rolí a role nevyhoví,
        // pošli uživatele na jeho dashboard (ne na login)
        if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
          const fallback = role === "admin" ? "/admin/dashboard" : "/user/dashboard";
          setRedirectTo(fallback);
          setStatus("redirect");
          return;
        }

        // vše OK
        setStatus("ok");
      } catch (err) {
        if (err?.name === "AbortError") return;
        // 401/403/500 apod. -> login
        console.error("Auth verify failed (/protected/me):", err?.response?.status, err?.response?.data || err?.message);
        setRedirectTo("/login");
        setStatus("redirect");
      }
    };

    verify();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };

    // Ověř znovu při změně cesty i při změně tokenu v localStorage
  }, [location.pathname, localStorage.getItem("token")]);

  if (status === "loading") {
    return <div style={{ padding: 24 }}>Načítání…</div>;
  }

  if (status === "redirect") {
    // zachovej návratovou URL, pokud jdeš na login
    const to = redirectTo || "/login";
    if (to === "/login") {
      return (
        <Navigate
          to={to}
          replace
          state={{ from: location.pathname + location.search }}
        />
      );
    }
    return <Navigate to={to} replace />;
  }

  return children;
}
