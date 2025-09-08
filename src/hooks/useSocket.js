// src/hooks/useSocket.js
import { useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(token) {
  const socketRef = useRef(null);

  const socket = useMemo(() => {
    if (!token) return null;

    // Přímé připojení na backend (5000)
    return io("http://localhost:5000", {
      path: "/socket.io",
      auth: { token },          // JWT token
      transports: ["websocket"],// čistě WS, případně můžeš vypustit pro fallback na polling
      withCredentials: true,
      reconnection: true,
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.connect();
    socketRef.current = socket;

    return () => {
      try {
        socket.disconnect();
      } catch (e) {
        console.error("Socket disconnect error:", e);
      }
    };
  }, [socket]);

  return socketRef.current;
}
