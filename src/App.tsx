import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Section = "chats" | "contacts" | "groups" | "calls" | "settings" | "notifications";
type Message = {
  id: number;
  text: string;
  time: string;
  mine: boolean;
  type?: "text" | "voice" | "image" | "file";
  fileName?: string;
  voiceDuration?: string;
  read?: boolean;
};
type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
  isChannel?: boolean;
  messages: Message[];
};

const INITIAL_CHATS: Chat[] = [
  {
    id: 1, name: "Алексей Петров", avatar: "АП", lastMessage: "Привет! Как дела?", time: "14:32",
    unread: 3, online: true,
    messages: [
      { id: 1, text: "Привет! Как дела?", time: "14:30", mine: false, type: "text", read: true },
      { id: 2, text: "Всё отлично, спасибо! А у тебя?", time: "14:31", mine: true, type: "text", read: true },
      { id: 3, text: "Тоже хорошо. Встретимся завтра?", time: "14:32", mine: false, type: "text", read: false },
    ],
  },
  {
    id: 2, name: "Мария Иванова", avatar: "МИ", lastMessage: "Смотри какой закат 😍", time: "13:15",
    unread: 1, online: true,
    messages: [
      { id: 1, text: "Смотри какой закат 😍", time: "13:15", mine: false, type: "image", read: false },
      { id: 2, text: "Красота!", time: "13:18", mine: true, type: "text", read: true },
    ],
  },
  {
    id: 3, name: "Команда разработки", avatar: "КР", lastMessage: "Деплой прошёл успешно ✅", time: "12:00",
    unread: 0, online: false, isGroup: true,
    messages: [
      { id: 1, text: "Начинаем деплой...", time: "11:55", mine: false, type: "text", read: true },
      { id: 2, text: "Деплой прошёл успешно ✅", time: "12:00", mine: false, type: "text", read: true },
    ],
  },
  {
    id: 4, name: "Дмитрий Сидоров", avatar: "ДС", lastMessage: "Голосовое сообщение", time: "вчера",
    unread: 0, online: false,
    messages: [
      { id: 1, text: "", time: "вчера", mine: false, type: "voice", voiceDuration: "0:42", read: true },
    ],
  },
  {
    id: 5, name: "Tech News", avatar: "TN", lastMessage: "React 19 вышел!", time: "вчера",
    unread: 12, online: false, isChannel: true,
    messages: [
      { id: 1, text: "React 19 официально вышел! Новые хуки, улучшения производительности и многое другое.", time: "вчера", mine: false, type: "text", read: false },
    ],
  },
  {
    id: 6, name: "Анна Козлова", avatar: "АК", lastMessage: "Документ отправила", time: "пн",
    unread: 0, online: false,
    messages: [
      { id: 1, text: "", time: "пн", mine: false, type: "file", fileName: "Договор_2026.pdf", read: true },
      { id: 2, text: "Документ отправила, посмотри когда будет время", time: "пн", mine: false, type: "text", read: true },
    ],
  },
];

const CONTACTS = [
  { id: 1, name: "Алексей Петров", username: "@alex_petrov", avatar: "АП", online: true, phone: "+7 999 123-45-67" },
  { id: 2, name: "Мария Иванова", username: "@maria_iv", avatar: "МИ", online: true, phone: "+7 999 234-56-78" },
  { id: 3, name: "Дмитрий Сидоров", username: "@dmitry_s", avatar: "ДС", online: false, phone: "+7 999 345-67-89" },
  { id: 4, name: "Анна Козлова", username: "@anna_k", avatar: "АК", online: false, phone: "+7 999 456-78-90" },
  { id: 5, name: "Сергей Новиков", username: "@sergey_n", avatar: "СН", online: true, phone: "+7 999 567-89-01" },
];

const AVATAR_COLORS: Record<string, string> = {
  АП: "#2AABEE", МИ: "#E84393", КР: "#34C759", ДС: "#FF9500",
  TN: "#5856D6", АК: "#FF3B30", СН: "#30D158", ВЫ: "#2AABEE",
};

function Avatar({ initials, size = 42, src }: { initials: string; size?: number; src?: string }) {
  const bg = AVATAR_COLORS[initials] || "#2AABEE";
  if (src) {
    return <img src={src} alt={initials} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, color: "#fff", flexShrink: 0, userSelect: "none" }}>
      {initials}
    </div>
  );
}

function OnlineDot({ online }: { online: boolean }) {
  if (!online) return null;
  return <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#34C759", border: "2px solid #17212b" }} />;
}

function fmtTime() {
  const n = new Date();
  return `${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = { width: 38, height: 38, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const sendBtnStyle: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" };
const modalBox: React.CSSProperties = { background: "#17212b", borderRadius: 16, padding: 24, width: 380, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", color: "#fff" };
const closeBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#2AABEE", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const secondaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const inputStyle: React.CSSProperties = { width: "100%", background: "#0e1621", border: "1px solid #2d3f51", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'Golos Text', sans-serif", boxSizing: "border-box" };

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState<Section>("chats");
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [groupType, setGroupType] = useState<"group" | "channel">("group");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);

  const [profile, setProfile] = useState({
    name: "Вы", username: "@my_username", phone: "+7 000 000-00-00",
    bio: "Привет! Я использую NexoGram.", avatar: "",
    notifications: true, soundEnabled: true,
  });
  const [editName, setEditName] = useState(profile.name);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editPhone, setEditPhone] = useState(profile.phone);

  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(globalSearch.toLowerCase()) ||
    c.phone.includes(globalSearch)
  );
  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    const msg: Message = { id: Date.now(), text: input.trim(), time: fmtTime(), mine: true, type: "text", read: false };
    const updated = { ...activeChat, messages: [...activeChat.messages, msg], lastMessage: input.trim(), time: fmtTime() };
    setChats(prev => prev.map(c => c.id === activeChat.id ? updated : c));
    setActiveChat(updated);
    setInput("");
  };

  const startRecording = () => {
    setRecording(true);
    setRecordTime(0);
    recordTimerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    if (!recordTimerRef.current) return;
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    if (!activeChat || recordTime < 1) { setRecording(false); setRecordTime(0); return; }
    const dur = `${Math.floor(recordTime / 60)}:${String(recordTime % 60).padStart(2, "0")}`;
    const msg: Message = { id: Date.now(), text: "", time: fmtTime(), mine: true, type: "voice", voiceDuration: dur, read: false };
    const updated = { ...activeChat, messages: [...activeChat.messages, msg], lastMessage: "Голосовое сообщение", time: fmtTime() };
    setChats(prev => prev.map(c => c.id === activeChat.id ? updated : c));
    setActiveChat(updated);
    setRecording(false);
    setRecordTime(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const isImage = file.type.startsWith("image/");
    const msg: Message = { id: Date.now(), text: "", time: fmtTime(), mine: true, type: isImage ? "image" : "file", fileName: file.name, read: false };
    const updated = { ...activeChat, messages: [...activeChat.messages, msg], lastMessage: isImage ? "Фото" : file.name, time: fmtTime() };
    setChats(prev => prev.map(c => c.id === activeChat.id ? updated : c));
    setActiveChat(updated);
    e.target.value = "";
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfile(p => ({ ...p, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const createGroup = () => {
    if (!groupName.trim()) return;
    const initials = groupName.slice(0, 2).toUpperCase();
    const newChat: Chat = {
      id: Date.now(), name: groupName, avatar: initials,
      lastMessage: groupType === "group" ? "Группа создана" : "Канал создан",
      time: fmtTime(), unread: 0, online: false,
      isGroup: groupType === "group", isChannel: groupType === "channel",
      messages: [{ id: 1, text: `${groupType === "group" ? "Группа" : "Канал"} «${groupName}» создан`, time: fmtTime(), mine: false, type: "text", read: true }],
    };
    setChats(prev => [newChat, ...prev]);
    setGroupName(""); setSelectedMembers([]); setShowNewGroup(false);
    setSection("chats"); setActiveChat(newChat);
  };

  const saveProfile = () => {
    setProfile(p => ({
      ...p, name: editName,
      username: editUsername.startsWith("@") ? editUsername : "@" + editUsername,
      bio: editBio, phone: editPhone,
    }));
    setEditingProfile(false);
  };

  const openChat = (chat: Chat) => {
    const updated = { ...chat, unread: 0 };
    setChats(prev => prev.map(c => c.id === chat.id ? updated : c));
    setActiveChat(updated);
    setSection("chats");
  };

  const navItems: { id: Section; icon: string; label: string }[] = [
    { id: "chats", icon: "MessageSquare", label: "Чаты" },
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "groups", icon: "UsersRound", label: "Группы" },
    { id: "calls", icon: "Phone", label: "Звонки" },
    { id: "notifications", icon: "Bell", label: "Уведомления" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "'Golos Text', sans-serif", background: "#0e1621", color: "#fff" }}>

      {/* ── Rail ── */}
      <div style={{ width: 62, background: "#17212b", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, paddingBottom: 10, gap: 2, borderRight: "1px solid #0d1117", flexShrink: 0 }}>
        <button onClick={() => setShowProfile(true)} style={{ marginBottom: 10, border: "none", background: "none", cursor: "pointer", padding: 0, position: "relative" }}>
          <Avatar initials="ВЫ" size={38} src={profile.avatar} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#34C759", border: "2px solid #17212b" }} />
        </button>
        {navItems.map(item => {
          const isActive = section === item.id;
          const badge = item.id === "chats" && totalUnread > 0 ? totalUnread : 0;
          return (
            <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
              style={{ width: 46, height: 46, borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: isActive ? "rgba(42,171,238,0.18)" : "transparent", transition: "all .15s" }}>
              <Icon name={item.icon} size={21} style={{ color: isActive ? "#2AABEE" : "#7d8e9e" }} />
              {badge > 0 && (
                <span style={{ position: "absolute", top: 6, right: 5, background: "#2AABEE", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{badge > 99 ? "99+" : badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Sidebar ── */}
      <div style={{ width: 310, background: "#17212b", display: "flex", flexDirection: "column", borderRight: "1px solid #0d1117", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>
            {{ chats: "Чаты", contacts: "Контакты", groups: "Группы и каналы", calls: "Звонки", notifications: "Уведомления", settings: "Настройки" }[section]}
          </span>
          {section === "chats" && (
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => { setGroupType("group"); setShowNewGroup(true); }} title="Новая группа" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(42,171,238,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="UserPlus" size={15} style={{ color: "#2AABEE" }} />
              </button>
              <button onClick={() => { setGroupType("channel"); setShowNewGroup(true); }} title="Новый канал" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(42,171,238,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Radio" size={15} style={{ color: "#2AABEE" }} />
              </button>
            </div>
          )}
        </div>

        {(section === "chats" || section === "contacts") && (
          <div style={{ margin: "0 10px 8px", position: "relative", flexShrink: 0 }}>
            <Icon name="Search" size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#7d8e9e" }} />
            <input
              placeholder={section === "contacts" ? "Имя, @username, телефон..." : "Поиск..."}
              value={section === "chats" ? searchQuery : globalSearch}
              onChange={e => section === "chats" ? setSearchQuery(e.target.value) : setGlobalSearch(e.target.value)}
              style={{ ...inputStyle, padding: "8px 12px 8px 30px", border: "none", borderRadius: 10, fontSize: 13 }}
            />
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* CHATS */}
          {section === "chats" && filteredChats.map(chat => (
            <button key={chat.id} onClick={() => openChat(chat)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", border: "none", background: activeChat?.id === chat.id ? "rgba(42,171,238,0.12)" : "transparent", cursor: "pointer", textAlign: "left", borderLeft: `3px solid ${activeChat?.id === chat.id ? "#2AABEE" : "transparent"}`, transition: "all .15s" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar initials={chat.avatar} size={44} />
                <OnlineDot online={chat.online} />
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#fff", display: "flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.isChannel && <Icon name="Radio" size={11} style={{ color: "#2AABEE", flexShrink: 0 }} />}
                    {chat.isGroup && !chat.isChannel && <Icon name="Users" size={11} style={{ color: "#34C759", flexShrink: 0 }} />}
                    {chat.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#7d8e9e", flexShrink: 0, marginLeft: 4 }}>{chat.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                  <span style={{ fontSize: 12, color: "#7d8e9e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.lastMessage}</span>
                  {chat.unread > 0 && <span style={{ background: "#2AABEE", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0, marginLeft: 4 }}>{chat.unread}</span>}
                </div>
              </div>
            </button>
          ))}

          {/* CONTACTS */}
          {section === "contacts" && (
            <>
              {globalSearch && filteredContacts.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#7d8e9e" }}>
                  <Icon name="SearchX" size={36} style={{ color: "#2d3f51", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>Ничего не найдено</p>
                  <p style={{ fontSize: 12, margin: "4px 0 0" }}>Попробуйте другой запрос</p>
                </div>
              )}
              {filteredContacts.map(c => (
                <button key={c.id} onClick={() => { const ex = chats.find(ch => ch.name === c.name); if (ex) openChat(ex); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar initials={c.avatar} size={42} />
                    <OnlineDot online={c.online} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#2AABEE" }}>{c.username}</div>
                    <div style={{ fontSize: 11, color: "#7d8e9e" }}>{c.phone}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* GROUPS */}
          {section === "groups" && (
            <>
              {chats.filter(c => c.isGroup || c.isChannel).length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#7d8e9e" }}>
                  <Icon name="UsersRound" size={40} style={{ color: "#2d3f51", marginBottom: 8 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>Нет групп и каналов</p>
                </div>
              )}
              {chats.filter(c => c.isGroup || c.isChannel).map(chat => (
                <button key={chat.id} onClick={() => openChat(chat)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <Avatar initials={chat.avatar} size={44} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 600, fontSize: 14, color: "#fff" }}>
                      {chat.isChannel ? <Icon name="Radio" size={12} style={{ color: "#2AABEE" }} /> : <Icon name="Users" size={12} style={{ color: "#34C759" }} />}
                      {chat.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#7d8e9e" }}>{chat.isChannel ? "Канал" : "Группа"}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* CALLS */}
          {section === "calls" && [
            { name: "Алексей Петров", av: "АП", type: "incoming", time: "сегодня 14:00", missed: false },
            { name: "Мария Иванова", av: "МИ", type: "outgoing", time: "вчера 20:15", missed: false },
            { name: "Дмитрий Сидоров", av: "ДС", type: "missed", time: "вчера 12:30", missed: true },
          ].map((call, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <Avatar initials={call.av} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: call.missed ? "#FF3B30" : "#fff" }}>{call.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#7d8e9e" }}>
                  <Icon name={call.type === "incoming" ? "PhoneIncoming" : call.type === "outgoing" ? "PhoneOutgoing" : "PhoneMissed"} size={12} style={{ color: call.missed ? "#FF3B30" : "#34C759" }} />
                  {call.type === "incoming" ? "Входящий" : call.type === "outgoing" ? "Исходящий" : "Пропущенный"} · {call.time}
                </div>
              </div>
              <button style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(52,199,89,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="Phone" size={14} style={{ color: "#34C759" }} />
              </button>
            </div>
          ))}

          {/* NOTIFICATIONS */}
          {section === "notifications" && (
            <div style={{ padding: 8 }}>
              {[
                { text: "Алексей Петров написал вам", sub: "Встретимся завтра?", time: "14:32", avatar: "АП" },
                { text: "Новое сообщение в группе", sub: "Команда разработки: Деплой прошёл ✅", time: "12:00", avatar: "КР" },
                { text: "Tech News: новая публикация", sub: "React 19 вышел!", time: "вчера", avatar: "TN" },
              ].map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <Avatar initials={n.avatar} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{n.text}</div>
                    <div style={{ fontSize: 12, color: "#7d8e9e", marginTop: 2 }}>{n.sub}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#7d8e9e", flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div style={{ padding: "4px 0" }}>
              {[
                { icon: "UserCircle", label: "Аккаунт", sub: "Имя, телефон, username", action: () => { setShowProfile(true); } },
                { icon: "Bell", label: "Уведомления", sub: "Звуки, вибрация", action: () => {} },
                { icon: "Lock", label: "Конфиденциальность", sub: "Последний визит, номер", action: () => {} },
                { icon: "Palette", label: "Оформление", sub: "Тёмная тема, шрифты", action: () => {} },
                { icon: "Globe", label: "Язык", sub: "Русский", action: () => {} },
                { icon: "HardDrive", label: "Данные и хранилище", sub: "Медиа, кэш", action: () => {} },
                { icon: "HelpCircle", label: "Помощь", sub: "FAQ, обратная связь", action: () => {} },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(42,171,238,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={item.icon} size={17} style={{ color: "#2AABEE" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#7d8e9e" }}>{item.sub}</div>
                  </div>
                  <Icon name="ChevronRight" size={15} style={{ color: "#3d4f61" }} />
                </button>
              ))}
              <div style={{ margin: "8px 14px 0", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Уведомления", key: "notifications" as const },
                  { label: "Звук", key: "soundEnabled" as const },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: "#c5d0da" }}>{item.label}</span>
                    <div onClick={() => setProfile(p => ({ ...p, [item.key]: !p[item.key] }))}
                      style={{ width: 42, height: 24, borderRadius: 12, background: profile[item.key] ? "#2AABEE" : "#2d3f51", cursor: "pointer", position: "relative", transition: "background .2s" }}>
                      <div style={{ position: "absolute", top: 2, left: profile[item.key] ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0e1621", minWidth: 0 }}>
        {activeChat ? (
          <>
            {/* Header */}
            <div style={{ height: 56, background: "#17212b", display: "flex", alignItems: "center", padding: "0 14px", gap: 10, borderBottom: "1px solid #0d1117", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <Avatar initials={activeChat.avatar} size={36} />
                <OnlineDot online={activeChat.online} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>
                  {activeChat.isChannel && <Icon name="Radio" size={12} style={{ color: "#2AABEE" }} />}
                  {activeChat.isGroup && !activeChat.isChannel && <Icon name="Users" size={12} style={{ color: "#34C759" }} />}
                  {activeChat.name}
                </div>
                <div style={{ fontSize: 12, color: activeChat.online ? "#34C759" : "#7d8e9e" }}>
                  {activeChat.isChannel ? "Канал" : activeChat.isGroup ? "Группа" : activeChat.online ? "в сети" : "не в сети"}
                </div>
              </div>
              <button style={iconBtnStyle} title="Голосовой звонок"><Icon name="Phone" size={18} style={{ color: "#7d8e9e" }} /></button>
              <button style={iconBtnStyle} title="Видеозвонок"><Icon name="Video" size={18} style={{ color: "#7d8e9e" }} /></button>
              <button style={iconBtnStyle} title="Поиск"><Icon name="Search" size={18} style={{ color: "#7d8e9e" }} /></button>
              <button style={iconBtnStyle} title="Меню"><Icon name="MoreVertical" size={18} style={{ color: "#7d8e9e" }} /></button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 40px", display: "flex", flexDirection: "column", gap: 4 }}>
              {activeChat.messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "64%", borderRadius: msg.mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.mine ? "#2b5278" : "#182533", padding: msg.type === "image" ? "4px" : "8px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                    {msg.type === "text" && <p style={{ margin: 0, fontSize: 14, color: "#fff", lineHeight: 1.5, wordBreak: "break-word" }}>{msg.text}</p>}
                    {msg.type === "image" && (
                      <div>
                        <div style={{ width: 200, height: 150, borderRadius: 10, background: "linear-gradient(135deg, #2AABEE22, #34C75922)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="Image" size={36} style={{ color: "#2AABEE" }} />
                        </div>
                        <div style={{ padding: "4px 8px 0", fontSize: 11, color: "#7d8e9e" }}>Фото</div>
                      </div>
                    )}
                    {msg.type === "file" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(42,171,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="FileText" size={18} style={{ color: "#2AABEE" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{msg.fileName}</div>
                          <div style={{ fontSize: 11, color: "#7d8e9e" }}>Документ</div>
                        </div>
                      </div>
                    )}
                    {msg.type === "voice" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 150 }}>
                        <button style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#2AABEE", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="Play" size={14} style={{ color: "#fff" }} />
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 2, background: "rgba(255,255,255,0.15)", borderRadius: 2, marginBottom: 4 }}>
                            <div style={{ width: "30%", height: "100%", background: "#2AABEE", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#7d8e9e" }}>{msg.voiceDuration}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: "#7d8e9e" }}>{msg.time}</span>
                      {msg.mine && <Icon name={msg.read ? "CheckCheck" : "Check"} size={12} style={{ color: msg.read ? "#2AABEE" : "#7d8e9e" }} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ background: "#17212b", borderTop: "1px solid #0d1117", padding: "10px 14px", flexShrink: 0 }}>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleFileUpload} />
              {recording ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: 42 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF3B30", animation: "pulse 1s infinite" }} />
                  <span style={{ color: "#FF3B30", fontWeight: 600, fontSize: 14 }}>
                    Запись... {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button onClick={stopRecording} style={{ ...sendBtnStyle, background: "#FF3B30" }}>
                    <Icon name="Square" size={14} style={{ color: "#fff" }} />
                  </button>
                  <button onClick={stopRecording} style={{ ...sendBtnStyle, background: "#2AABEE" }}>
                    <Icon name="Send" size={16} style={{ color: "#fff" }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => fileInputRef.current?.click()} style={iconBtnStyle}>
                    <Icon name="Paperclip" size={20} style={{ color: "#7d8e9e" }} />
                  </button>
                  <input
                    placeholder="Написать сообщение..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    style={{ flex: 1, background: "#0e1621", border: "none", borderRadius: 20, padding: "9px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'Golos Text', sans-serif" }}
                  />
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    style={iconBtnStyle}>
                    <Icon name="Mic" size={20} style={{ color: recording ? "#FF3B30" : "#7d8e9e" }} />
                  </button>
                  <button onClick={sendMessage} disabled={!input.trim()}
                    style={{ ...sendBtnStyle, background: input.trim() ? "#2AABEE" : "#253344", transition: "background .2s" }}>
                    <Icon name="Send" size={16} style={{ color: "#fff" }} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(42,171,238,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="MessageSquare" size={44} style={{ color: "#2AABEE", opacity: 0.35 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#4d6278", margin: "0 0 6px" }}>NexoGram</p>
              <p style={{ fontSize: 14, color: "#3d4f61", margin: 0 }}>Выберите чат, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Profile Modal ── */}
      {showProfile && (
        <div style={modalOverlay} onClick={() => { setShowProfile(false); setEditingProfile(false); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Мой профиль</h2>
              <button onClick={() => { setShowProfile(false); setEditingProfile(false); }} style={closeBtn}>
                <Icon name="X" size={16} style={{ color: "#7d8e9e" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => avatarInputRef.current?.click()}>
                <Avatar initials="ВЫ" size={86} src={profile.avatar} />
                <div style={{ position: "absolute", bottom: 2, right: 2, width: 26, height: 26, borderRadius: "50%", background: "#2AABEE", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                  <Icon name="Camera" size={13} style={{ color: "#fff" }} />
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />

              {!editingProfile ? (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: "#fff" }}>{profile.name}</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#2AABEE" }}>{profile.username}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7d8e9e" }}>{profile.phone}</p>
                  {profile.bio && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#aab8c5", maxWidth: 280 }}>{profile.bio}</p>}
                </div>
              ) : (
                <div style={{ width: "100%", marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#7d8e9e", marginBottom: 4, display: "block" }}>Имя</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Имя" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#7d8e9e", marginBottom: 4, display: "block" }}>Username</label>
                    <input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="@username" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#7d8e9e", marginBottom: 4, display: "block" }}>Номер телефона</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+7 000 000-00-00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#7d8e9e", marginBottom: 4, display: "block" }}>О себе</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Расскажите о себе..."
                      style={{ ...inputStyle, height: 72, resize: "none" }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {!editingProfile ? (
                <button onClick={() => { setEditingProfile(true); setEditName(profile.name); setEditUsername(profile.username); setEditBio(profile.bio); setEditPhone(profile.phone); }} style={primaryBtn}>
                  <Icon name="Pencil" size={14} style={{ color: "#fff" }} /> Редактировать
                </button>
              ) : (
                <>
                  <button onClick={saveProfile} style={primaryBtn}><Icon name="Check" size={14} style={{ color: "#fff" }} /> Сохранить</button>
                  <button onClick={() => setEditingProfile(false)} style={secondaryBtn}>Отмена</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Group / Channel Modal ── */}
      {showNewGroup && (
        <div style={modalOverlay} onClick={() => setShowNewGroup(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {groupType === "group" ? "Новая группа" : "Новый канал"}
              </h2>
              <button onClick={() => setShowNewGroup(false)} style={closeBtn}>
                <Icon name="X" size={16} style={{ color: "#7d8e9e" }} />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#7d8e9e", marginBottom: 6, display: "block" }}>
                {groupType === "group" ? "Название группы" : "Название канала"}
              </label>
              <input value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder={groupType === "group" ? "Моя группа" : "Мой канал"}
                style={inputStyle} autoFocus />
            </div>
            {groupType === "group" && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#7d8e9e", margin: "0 0 10px" }}>Добавить участников:</p>
                <div style={{ maxHeight: 180, overflowY: "auto" }}>
                  {CONTACTS.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedMembers.includes(c.id)}
                        onChange={() => setSelectedMembers(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                        style={{ accentColor: "#2AABEE", width: 16, height: 16 }} />
                      <Avatar initials={c.avatar} size={32} />
                      <span style={{ fontSize: 14, color: "#fff" }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: "#2AABEE", marginLeft: "auto" }}>{c.username}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={createGroup} disabled={!groupName.trim()}
              style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: groupName.trim() ? 1 : 0.5 }}>
              <Icon name={groupType === "group" ? "Users" : "Radio"} size={15} style={{ color: "#fff" }} />
              {groupType === "group" ? "Создать группу" : "Создать канал"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3f51; border-radius: 4px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
