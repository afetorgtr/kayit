"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
  Loader2,
  Phone,
  CheckCircle2,
  Circle,
  Tag,
} from "lucide-react";

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ContactMessagesAdmin() {
  const router = useRouter();
  const [password, setPassword] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (!savedPassword) {
      router.replace("/admin");
      return;
    }
    setPassword(savedPassword);
    fetchMessages(savedPassword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async (pwd: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/contact", {
        headers: { Authorization: pwd },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("admin_password");
        router.replace("/admin");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Mesajlar yüklenemedi.");
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (id: string, next: boolean) => {
    if (!password) return;
    setBusyId(id);
    // Optimistic update
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: next } : m)));
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: password },
        body: JSON.stringify({ is_read: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !next } : m)));
      setError("Mesaj güncellenemedi.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!password) return;
    if (!window.confirm(`"${name}" kişisinin mesajını silmek istediğinize emin misiniz?`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: "DELETE",
        headers: { Authorization: password },
      });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Mesaj silinemedi.");
    } finally {
      setBusyId(null);
    }
  };

  const visible = filter === "unread" ? messages.filter((m) => !m.is_read) : messages;
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="min-h-screen bg-[#040a16] text-zinc-100 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="w-full border-b border-sky-950/30 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-[#e7c878]" size={20} />
            <div>
              <h1 className="text-xs font-black text-[#e7c878] uppercase tracking-wider">
                İletişim Mesajları
              </h1>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                Ziyaretçi İletileri
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-bold transition-all"
          >
            <ArrowLeft size={14} /> Panele Dön
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Toolbar: counts + filter */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-bold text-zinc-200">{messages.length}</span> mesaj
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#e7c878]/15 text-[#e7c878] font-bold">
                {unreadCount} okunmamış
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/40 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "all" ? "bg-sky-950/60 text-[#e7c878]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === "unread" ? "bg-sky-950/60 text-[#e7c878]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Okunmamış
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="animate-spin text-[#e7c878]" size={32} />
            <p className="text-xs text-zinc-400">Mesajlar yükleniyor...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
            <MessageSquare size={40} className="opacity-30" />
            <p className="text-sm">
              {filter === "unread" ? "Okunmamış mesaj yok." : "Henüz iletişim mesajı yok."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.is_read
                    ? "bg-zinc-900/20 border-zinc-800/40"
                    : "bg-sky-950/10 border-sky-800/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!m.is_read && <span className="w-2 h-2 rounded-full bg-[#e7c878] shrink-0" />}
                      <span className="font-bold text-zinc-100 text-sm">
                        {m.first_name} {m.last_name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-[10px] font-bold text-[#e7c878]">
                        <Tag size={10} /> {m.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-zinc-400">
                      <a
                        href={`tel:${m.phone}`}
                        className="flex items-center gap-1 hover:text-[#e7c878] transition-colors"
                      >
                        <Phone size={11} className="text-zinc-600" /> {m.phone}
                      </a>
                      <span className="text-zinc-600">
                        {new Date(m.created_at).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                      {m.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleRead(m.id, !m.is_read)}
                      disabled={busyId === m.id}
                      title={m.is_read ? "Okunmadı olarak işaretle" : "Okundu olarak işaretle"}
                      className="inline-flex items-center justify-center w-9 h-9 bg-zinc-900/60 hover:bg-sky-950/40 hover:text-[#e7c878] rounded-xl border border-zinc-800 text-zinc-400 transition-all disabled:opacity-50"
                    >
                      {m.is_read ? <CheckCircle2 size={15} className="text-[#e7c878]" /> : <Circle size={15} />}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, `${m.first_name} ${m.last_name}`)}
                      disabled={busyId === m.id}
                      title="Mesajı sil"
                      className="inline-flex items-center justify-center w-9 h-9 bg-zinc-900/60 hover:bg-red-950/30 hover:text-red-400 hover:border-red-950/40 rounded-xl border border-zinc-800 text-zinc-500 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
