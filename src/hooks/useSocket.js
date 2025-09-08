// src/hooks/useSocket.js
import { useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(token) {
  const socketRef = useRef(null);

  const socket = useMemo(() => {
    if (!token) return null;
    const s = io("http://localhost:5000", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
    });
    return s;
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const onConnect = () => console.log("[SOCKET] connected, id:", socket.id);
    const onError = (err) => console.error("[SOCKET] connect_error:", err?.message || err);
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      try { socket.disconnect(); } catch {}
    };
  }, [socket]);

  return socketRef.current;
}
