import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MessageCircle, X, Send, Search, ChevronLeft, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч.`;
  return new Date(ts).toLocaleDateString("ru-KG", { day: "numeric", month: "short" });
}

function fullTime(ts: string) {
  return new Date(ts).toLocaleTimeString("ru-KG", { hour: "2-digit", minute: "2-digit" });
}

function getUserName(u: any) {
  if (!u) return "Пользователь";
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.email || "Пользователь";
}

function getInitials(u: any) {
  if (!u) return "П";
  const fn = u.firstName || "";
  const ln = u.lastName || "";
  if (fn && ln) return fn[0] + ln[0];
  if (fn) return fn[0];
  if (u.email) return u.email[0].toUpperCase();
  return "П";
}

const AVATAR_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function ChatPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["chat-conversations"],
    queryFn: () => api.get("/messages/conversations").then(r => r.data),
    refetchInterval: open ? 5000 : 60000,
  });

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["chat-messages", activeConv],
    queryFn: () => activeConv ? api.get(`/messages/${activeConv}`).then(r => r.data) : [],
    enabled: !!activeConv,
    refetchInterval: activeConv ? 3000 : false,
  });

  const { data: companyUsers = [] } = useQuery<any[]>({
    queryKey: ["company-users"],
    queryFn: () => api.get("/users").then(r => r.data),
  });

  const totalUnread = conversations.reduce((s: number, c: any) => s + (c.unreadCount || 0), 0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (activeConv) qc.invalidateQueries({ queryKey: ["chat-conversations"] });
  }, [messages.length]);

  async function sendMessage() {
    if (!message.trim() || !activeConv) return;
    await api.post("/messages", { toUserId: activeConv, content: message.trim() });
    setMessage("");
    qc.invalidateQueries({ queryKey: ["chat-messages", activeConv] });
    qc.invalidateQueries({ queryKey: ["chat-conversations"] });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const activeUser = activeConv ? companyUsers.find((u: any) => u.id === activeConv) : null;
  const myId = (user as any)?.id;

  const filteredUsers = companyUsers.filter((u: any) => {
    if (u.id === myId) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return getUserName(u).toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MessageCircle className="w-[18px] h-[18px] text-gray-500" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-blue-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold leading-none px-0.5">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[440px] bg-white rounded-xl shadow-xl border border-gray-100 z-[1000] flex flex-col"
          style={{ height: "520px" }}>

          {activeConv && !showNewChat ? (
            // ── CONVERSATION VIEW ──────────────────────────────────────
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <button onClick={() => setActiveConv(null)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: activeConv ? avatarColor(activeConv) : "#4F46E5" }}>
                  {getInitials(activeUser)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{getUserName(activeUser)}</p>
                  <p className="text-[10px] text-gray-400">{activeUser?.email}</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">Начните общение</p>
                  </div>
                ) : messages.map((m: any, idx: number) => {
                  const isMe = m.fromUserId === myId;
                  const showDate = idx === 0 || new Date(messages[idx - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex items-center gap-2 my-2">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[10px] text-gray-400">
                            {new Date(m.createdAt).toLocaleDateString("ru-KG", { day: "numeric", month: "long" })}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}>
                            {m.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-0.5 px-1">{fullTime(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t flex gap-2">
                <Input
                  className="flex-1 text-sm h-9"
                  placeholder="Написать сообщение..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : showNewChat ? (
            // ── NEW CHAT ────────────────────────────────────────────────
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <button onClick={() => setShowNewChat(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-900 flex-1">Новый чат</span>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
                  <Input className="pl-8 h-8 text-sm" placeholder="Поиск сотрудника..."
                    value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">Сотрудники не найдены</div>
                ) : filteredUsers.map((u: any) => (
                  <button key={u.id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    onClick={() => { setActiveConv(u.id); setShowNewChat(false); setSearch(""); }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: avatarColor(u.id) }}>
                      {getInitials(u)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getUserName(u)}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // ── CONVERSATIONS LIST ─────────────────────────────────────
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                <span className="font-semibold text-gray-900 text-sm">Чаты</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowNewChat(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Новый чат
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
                  <Input className="pl-8 h-8 text-sm" placeholder="Поиск чата..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <MessageCircle className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Нет диалогов</p>
                    <button onClick={() => setShowNewChat(true)}
                      className="text-xs text-blue-600 hover:underline mt-1">Начать новый чат</button>
                  </div>
                ) : conversations
                  .filter((c: any) => !search || getUserName(c.partner).toLowerCase().includes(search.toLowerCase()))
                  .map((c: any) => (
                  <button key={c.partnerId}
                    onClick={() => { setActiveConv(c.partnerId); setSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: avatarColor(c.partnerId) }}>
                        {getInitials(c.partner)}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold px-0.5">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${c.unreadCount ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                          {getUserName(c.partner)}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                          {timeAgo(c.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {c.lastMessage?.fromUserId === myId ? "Вы: " : ""}{c.lastMessage?.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Compact users list */}
              {conversations.length === 0 && companyUsers.filter((u: any) => u.id !== myId).length > 0 && (
                <div className="border-t p-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Коллеги</p>
                  <div className="flex gap-2 flex-wrap">
                    {companyUsers.filter((u: any) => u.id !== myId).map((u: any) => (
                      <button key={u.id}
                        onClick={() => setActiveConv(u.id)}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: avatarColor(u.id) }}>
                          {getInitials(u)}
                        </div>
                        <span className="text-[10px] text-gray-600 max-w-[52px] truncate">{u.firstName || u.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
