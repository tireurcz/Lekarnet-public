// src/components/ProtectedRoute.jsx
import React, { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import API from "../utils/api";

// detekce zrušeného požadavku (axios/Abort/HMR)
function isCancelError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    /abort|cancel/.test(msg)
  );
}

export default function ProtectedRoute({ children, roles }) {
  const [status, setStatus] = useState("loading"); // 'loading' | 'ok' | 'redirect'
  const [redirectTo, setRedirectTo] = useState(null);
  const location = useLocation();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    console.log("[GUARD v3] mounted at", location.pathname);

    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!mountedRef.current) return;
        setRedirectTo("/login");
        setStatus("redirect");
        return;
      }

      try {
        const res = await API.get("/protected/me"); // { ok, user: { role, ... } }

        if (res?.data?.ok === false) {
          if (!mountedRef.current) return;
          setRedirectTo("/login");
          setStatus("redirect");
          return;
        }

        const role =
          typeof res?.data?.user?.role === "string" && res.data.user.role.trim()
            ? res.data.user.role.trim()
            : "user";

        // odkomentuj si při ladění:
        // console.log("[GUARD v3] ok:", res?.data?.ok, "role:", role, "allowed:", roles);

        if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
          const fallback = role === "admin" ? "/admin/dashboard" : "/user/dashboard";
          if (!mountedRef.current) return;
          setRedirectTo(fallback);
          setStatus("redirect");
          return;
        }

        if (!mountedRef.current) return;
        setStatus("ok");
      } catch (err) {
        if (isCancelError(err)) {
          // DEV/HMR: běžné, tiše ignoruj
          return;
        }

        // 401 → token neplatný/expir.
        if (err?.response?.status === 401) {
          if (!mountedRef.current) return;
          setRedirectTo("/login");
          setStatus("redirect");
          return;
        }

        // ostatní chyby → login
        if (!mountedRef.current) return;
        setRedirectTo("/login");
        setStatus("redirect");
      }
    };

    verify();

    return () => {
      mountedRef.current = false;
    };
  }, [location.pathname, roles]);

  if (status === "loading") {
    return <div style={{ padding: 24 }}>Načítám…</div>;
  }

  if (status === "redirect") {
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
