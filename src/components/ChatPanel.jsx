import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "../api"; // tvoje api helpery
import { useSocket } from "../hooks/useSocket";

// vytáhne payload z JWT (z tvého kódu)
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

  const canPharmacy = !!me?.pharmacyCode;

  // Načtení historie
  async function loadHistory(sc) {
    const { ok, items } = await apiGet(`/chat/history?scope=${sc}&limit=100`);
    if (ok !== false) setMessages(items || []);
  }

  useEffect(() => {
    loadHistory(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Příjem live zpráv
  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      // filtruj jen zprávy odpovídající scope
      if (msg.scope !== scope) return;
      // company zprávy vždy; pharmacy jen když mám stejný pharmacyCode
      if (scope === "pharmacy") {
        if (String(msg.pharmacyCode || "") !== String(me?.pharmacyCode || "")) {
          return;
        }
      }
      setMessages((m) => [...m, msg]);
    };
    socket.on("chat:message", onMsg);
    return () => socket.off("chat:message", onMsg);
  }, [socket, scope, me?.pharmacyCode]);

  // Odeslání zprávy
  const send = () => {
    const t = text.trim();
    if (!t || !socket) return;
    socket.emit("chat:message", { scope, text: t }, (res) => {
      if (res?.ok) {
        setText("");
        // zpráva už přijde přes broadcast, ale pro jistotu ji můžeme přidat okamžitě
        // setMessages((prev) => [...prev, res.message]);
      }
    });
  };

  // UI
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
          Přihlášen: <b>{me?.name || "Uživatel"}</b> • Firma: <b>{me?.company}</b>
          {canPharmacy ? <> • Kód: <b>{me?.pharmacyCode}</b></> : null}
        </div>
      </div>

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
              <div className="text-sm">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==="Enter") send(); }}
          placeholder="Napiš zprávu…"
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button onClick={send} className="px-4 py-2 rounded-xl border">
          Odeslat
        </button>
      </div>
    </div>
  );
}
