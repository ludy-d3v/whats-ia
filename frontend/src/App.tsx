import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

type ChatRow = { chatId: string; lastTs: number };
type Msg = { chatId: string; fromMe: 0 | 1; body: string; ts: number };

const socket = io("http://localhost:3000");

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function App() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState("connecting...");
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [filter, setFilter] = useState("");

  // carrega chats ao abrir
  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => setChats(data));
  }, []);

  // sockets
  useEffect(() => {
    function onQr(p: any) {
      setQr(p.dataUrl);
      setStatus("qr");
    }
    function onStatus(p: any) {
      setStatus(p.status || "unknown");
      if (p.status !== "qr") setQr(null);
    }
    function refreshActive() {
      if (activeChat) fetchMsgs(activeChat);
      // e atualiza lista de chats para ordenar pelo último ts
      fetch("/api/chats")
        .then((r) => r.json())
        .then((data) => setChats(data));
    }

    socket.on("qr", onQr);
    socket.on("status", onStatus);
    socket.on("inbound", refreshActive);
    socket.on("outbound", refreshActive);

    return () => {
      socket.off("qr", onQr);
      socket.off("status", onStatus);
      socket.off("inbound", refreshActive);
      socket.off("outbound", refreshActive);
    };
  }, [activeChat]);

  function fetchMsgs(chatId: string) {
    fetch(`/api/messages/${chatId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data));
  }

  function handleSelectChat(chatId: string) {
    setActiveChat(chatId);
    fetchMsgs(chatId);
  }

  const filteredChats = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.chatId.toLowerCase().includes(q));
  }, [chats, filter]);

  const statusBadge = useMemo(() => {
    const map: Record<string, string> = {
      ready: "success",
      qr: "warning",
      disconnected: "danger",
      connecting: "secondary",
    };
    const variant = map[status] ?? "secondary";
    const text =
      status === "ready"
        ? "Conectado"
        : status === "qr"
        ? "Escaneie o QR"
        : status === "disconnected"
        ? "Desconectado"
        : "Conectando...";
    return (
      <span className={`badge text-bg-${variant} rounded-pill ms-2`}>
        {text}
      </span>
    );
  }, [status]);

  return (
    <div className="vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center gap-2">
            <span role="img" aria-label="bot">🤖</span> Whats & IA
            {statusBadge}
          </span>
          <form className="d-flex ms-auto" role="search" onSubmit={(e)=>e.preventDefault()}>
            <input
              className="form-control"
              type="search"
              placeholder="Filtrar chat..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 260 }}
            />
          </form>
        </div>
      </nav>

      {/* Corpo */}
      <div className="container-fluid flex-grow-1">
        <div className="row h-100">
          {/* Sidebar de Chats */}
          <aside className="col-12 col-md-4 col-lg-3 border-end p-0 d-flex flex-column">
            <div className="p-3 border-bottom">
              <h6 className="mb-1">Chats</h6>
              <small className="text-muted">
                {filteredChats.length} conversa(s)
              </small>
            </div>

            {/* QR quando necessário */}
            {status === "qr" && qr && (
              <div className="p-3 border-bottom">
                <div className="alert alert-warning mb-2">
                  Escaneie o QR no WhatsApp (Aparelhos Conectados)
                </div>
                <img
                  src={qr}
                  alt="QR"
                  className="img-fluid rounded border"
                />
              </div>
            )}

            {/* Lista de chats */}
            <div className="list-group list-group-flush overflow-auto">
              {filteredChats.length === 0 && (
                <div className="p-3 text-muted">Nenhum chat encontrado.</div>
              )}
              {filteredChats.map((c) => (
                <button
                  key={c.chatId}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeChat === c.chatId ? "active" : ""}`}
                  onClick={() => handleSelectChat(c.chatId)}
                  title={c.chatId}
                >
                  <span className="text-truncate" style={{ maxWidth: "75%" }}>
                    {c.chatId}
                  </span>
                  <small className="opacity-75">{formatTime(c.lastTs)}</small>
                </button>
              ))}
            </div>
          </aside>

          {/* Painel de Mensagens */}
          <main className="col-12 col-md-8 col-lg-9 d-flex flex-column p-0">
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-0">
                  {activeChat ? activeChat : "Selecione um chat"}
                </h6>
                <small className="text-muted">
                  {activeChat ? "Mensagens" : "Escolha um chat na lista à esquerda"}
                </small>
              </div>
              {activeChat && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => fetchMsgs(activeChat)}
                >
                  Atualizar
                </button>
              )}
            </div>

            {/* Área de mensagens */}
            <div className="flex-grow-1 overflow-auto p-3 bg-light">
              {!activeChat && (
                <div className="text-center text-muted mt-5">
                  <p>👈 Selecione um chat para visualizar as mensagens.</p>
                </div>
              )}

              {activeChat && messages.length === 0 && (
                <div className="text-center text-muted mt-5">
                  <p>Nenhuma mensagem por aqui ainda…</p>
                </div>
              )}

              {activeChat &&
                messages.map((m, i) => (
                  <MessageBubble key={i} msg={m} />
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** Bolha de mensagem estilizada (direita=fromMe, esquerda=remetente) */
function MessageBubble({ msg }: { msg: Msg }) {
  const mine = msg.fromMe === 1;
  return (
    <div className={`d-flex mb-2 ${mine ? "justify-content-end" : "justify-content-start"}`}>
      <div className={`p-2 rounded-3 shadow-sm ${mine ? "bg-success text-white" : "bg-white border"}`} style={{ maxWidth: "75%" }}>
        <div className="small mb-1 opacity-75">
          {mine ? "Você" : msg.chatId} • {formatTime(msg.ts)}
        </div>
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.body}
        </div>
      </div>
    </div>
  );
}
