// src/components/ChatPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "../api";
import { useSocket } from "../hooks/useSocket";

function getUserFromToken() {
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

export default function ChatPanel() {
  const me = getUserFromToken();
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token") || null;

  const socket = useSocket(token);

  const [scope, setScope] = useState("company"); // "company" | "pharmacy"
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const canPharmacy = !!me?.pharmacyCode;

  async function loadHistory(sc) {
    setLoading(true);
    setLoadError(null);
    const url = `/chat/history?scope=${sc}&limit=100`; // api helper přidá /api
    try {
      const res = await apiGet(url);
      console.log("[CHAT] history GET", url, "→", res.status, res.ok, res.error);
      if (res.ok) {
        setMessages(res.items || []);
      } else {
        setMessages([]);
        setLoadError(res.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("[CHAT] history error", e);
      setLoadError(String(e));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => console.log("[CHAT] socket connected");
    const onDisconnect = (reason) => console.warn("[CHAT] socket disconnected:", reason);
    const onError = (err) => console.error("[CHAT] socket error:", err?.message || err);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    const onMsg = (msg) => {
      if (msg.scope !== scope) return;
      if (scope === "pharmacy") {
        if (String(msg.pharmacyCode || "") !== String(me?.pharmacyCode || "")) return;
      }
      setMessages((m) => [...m, msg]);
    };
    socket.on("chat:message", onMsg);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("chat:message", onMsg);
    };
  }, [socket, scope, me?.pharmacyCode]);

  const send = () => {
    const t = (text || "").trim();
    if (!t || !socket) return;
    if (!socket.connected) {
      console.warn("[CHAT] send blocked: socket not connected");
      return;
    }
    console.log("[CHAT] emitting chat:message", { scope, text: t });
    socket.emit("chat:message", { scope, text: t }, (ack) => {
      console.log("[CHAT] ack:", ack);
      if (ack?.ok) setText("");
    });
  };

  const disabled = !text.trim() || !socket || !socket.connected;

  return (
    <div className="w-full h-full max-h-[600px] flex flex-col border rounded-2xl p-3 gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setScope("company")}
          className={`px-3 py-1 rounded-xl border ${scope==="company" ? "bg-gray-200" : ""}`}
        >
          Firemní chat
        </button>
        <button
          disabled={!canPharmacy}
          onClick={() => setScope("pharmacy")}
          className={`px-3 py-1 rounded-xl border ${scope==="pharmacy" ? "bg-gray-200" : ""} ${!canPharmacy ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Pobočkový chat {canPharmacy ? `(kód ${me?.pharmacyCode})` : ""}
        </button>
        <div className="ml-auto text-sm text-gray-500">
          Přihlášen: <b>{me?.name || "Uživatel"}</b> • Firma: <b>{me?.company || "?"}</b>
          {canPharmacy ? <> • Kód: <b>{me?.pharmacyCode}</b></> : null}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Načítám historii…</div>
      ) : loadError ? (
        <div className="text-sm text-red-600">
          Nepodařilo se načíst historii: {String(loadError)}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto border rounded-xl p-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm">Zatím žádné zprávy…</div>
        ) : (
          messages.map((m) => (
            <div key={m._id || m.createdAt} className="mb-2">
              <div className="text-xs text-gray-500">
                <b>{m.authorName}</b>{" "}
                • {new Date(m.createdAt).toLocaleString()}
                {m.scope === "pharmacy" && m.pharmacyCode ? (
                  <> • pobočka {m.pharmacyCode}</>
                ) : null}
              </div>
              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==="Enter") send(); }}
          placeholder={socket?.connected ? "Napiš zprávu…" : "Čekám na připojení socketu…"}
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button onClick={send} disabled={disabled} className={`px-4 py-2 rounded-xl border ${disabled ? "opacity-50" : ""}`}>
          Odeslat
        </button>
      </div>
    </div>
  );
}
