"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Plus,
  Image as ImageIcon,
  Loader2,
  Building2,
  Star,
} from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  sort_order: number;
  is_badge_sponsor: boolean;
}

export default function SponsorsAdmin() {
  const router = useRouter();
  const [password, setPassword] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New sponsor form
  const [newName, setNewName] = useState("");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const newLogoInputRef = useRef<HTMLInputElement>(null);

  // Per-row logo upload state (id currently uploading)
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingBadgeId, setTogglingBadgeId] = useState<string | null>(null);

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (!savedPassword) {
      router.replace("/admin");
      return;
    }
    setPassword(savedPassword);
    fetchSponsors(savedPassword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSponsors = async (pwd: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sponsors", {
        headers: { Authorization: pwd },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("admin_password");
        router.replace("/admin");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Destekleyenler yüklenemedi.");
      }
      const data = await res.json();
      setSponsors(data.sponsors || []);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !newName.trim()) return;

    setAdding(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", newName.trim());
      formData.append("sort_order", String(sponsors.length + 1));
      if (newLogo) formData.append("logo", newLogo);

      const res = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { Authorization: password },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Destekleyen eklenemedi.");
      }
      setNewName("");
      setNewLogo(null);
      if (newLogoInputRef.current) newLogoInputRef.current.value = "";
      await fetchSponsors(password);
    } catch (err: any) {
      setError(err.message || "Ekleme başarısız oldu.");
    } finally {
      setAdding(false);
    }
  };

  const handleLogoUpload = async (id: string, file: File) => {
    if (!password) return;
    setUploadingId(id);
    setError("");
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PATCH",
        headers: { Authorization: password },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Logo yüklenemedi.");
      }
      await fetchSponsors(password);
    } catch (err: any) {
      setError(err.message || "Logo yükleme başarısız oldu.");
    } finally {
      setUploadingId(null);
    }
  };

  // Toggle the "lanyard sponsor" flag. The server enforces a single badge sponsor,
  // so enabling one automatically clears any previously selected sponsor.
  const handleToggleBadgeSponsor = async (id: string, next: boolean) => {
    if (!password) return;
    setTogglingBadgeId(id);
    setError("");
    try {
      const formData = new FormData();
      formData.append("is_badge_sponsor", String(next));

      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PATCH",
        headers: { Authorization: password },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Yaka kartı sponsoru güncellenemedi.");
      }
      await fetchSponsors(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Güncelleme başarısız oldu.");
    } finally {
      setTogglingBadgeId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!password) return;
    if (!window.confirm(`"${name}" destekleyenini silmek istediğinize emin misiniz?`)) return;

    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "DELETE",
        headers: { Authorization: password },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Silme başarısız oldu.");
      }
      await fetchSponsors(password);
    } catch (err: any) {
      setError(err.message || "Silme başarısız oldu.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#040a16] text-zinc-100 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="w-full border-b border-sky-950/30 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="text-[#e7c878]" size={20} />
            <div>
              <h1 className="text-xs font-black text-[#e7c878] uppercase tracking-wider">
                Destekleyen Kurumlar
              </h1>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                Sponsor Yönetimi
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

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Add new sponsor */}
        <form
          onSubmit={handleAddSponsor}
          className="p-5 bg-zinc-900/20 border border-zinc-800/40 rounded-2xl space-y-4"
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Plus size={16} className="text-[#e7c878]" /> Yeni Destekleyen Ekle
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Firma / Kurum adı"
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#e7c878] focus:ring-1 focus:ring-[#e7c878]/20 rounded-xl py-2 px-4 text-sm outline-none transition-all"
            />
            <label className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 font-bold cursor-pointer hover:border-sky-800/40 transition-all">
              <Upload size={14} />
              <span className="truncate max-w-[160px]">{newLogo ? newLogo.name : "Logo seç (opsiyonel)"}</span>
              <input
                ref={newLogoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={(e) => setNewLogo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="px-5 py-2 bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#e7c878] hover:brightness-110 text-zinc-950 rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ekle
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">
            Kabul edilen formatlar: PNG, JPG, SVG, WEBP (maks. 2 MB). Logo şimdi yüklenmezse sonra eklenebilir.
          </p>
        </form>

        {/* Sponsor list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-zinc-500">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs">Yükleniyor...</span>
            </div>
          ) : sponsors.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              Henüz destekleyen eklenmemiş.
            </div>
          ) : (
            sponsors.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  s.is_badge_sponsor
                    ? "bg-sky-950/10 border-[#e7c878]/50 ring-1 ring-[#e7c878]/20"
                    : "bg-zinc-900/10 border-zinc-800/40"
                }`}
              >
                {/* Logo preview / placeholder */}
                <div className="w-20 h-14 shrink-0 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-center overflow-hidden">
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt={s.name} className="max-h-12 max-w-[72px] object-contain" />
                  ) : (
                    <ImageIcon size={18} className="text-zinc-700" />
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{s.name}</p>
                    {s.is_badge_sponsor && (
                      <span className="inline-flex items-center gap-1 shrink-0 text-[9px] font-black text-[#e7c878] bg-sky-950/40 border border-[#e7c878]/30 rounded px-1.5 py-0.5 uppercase tracking-wider">
                        <Star size={9} className="fill-[#e7c878]" /> Ana Sponsor
                      </span>
                    )}
                  </div>
                  {!s.logo_url && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-400/80 bg-amber-950/20 border border-amber-900/30 rounded px-2 py-0.5 uppercase tracking-wider">
                      Logo bekleniyor
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleBadgeSponsor(s.id, !s.is_badge_sponsor)}
                    disabled={togglingBadgeId === s.id || (!s.logo_url && !s.is_badge_sponsor)}
                    title={
                      !s.logo_url && !s.is_badge_sponsor
                        ? "Ana sponsor olması için önce logo yükleyin."
                        : s.is_badge_sponsor
                        ? "Ana sponsorluğu kaldır"
                        : "Bu sponsoru yaka kartına ana sponsor yap"
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      s.is_badge_sponsor
                        ? "bg-[#e7c878]/15 text-[#e7c878] border-[#e7c878]/40 hover:bg-[#e7c878]/25"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-sky-800/40 hover:text-[#e7c878]"
                    }`}
                  >
                    {togglingBadgeId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Star size={14} className={s.is_badge_sponsor ? "fill-[#e7c878]" : ""} />
                    )}
                    {s.is_badge_sponsor ? "Ana Sponsor" : "Ana Sponsor Yap"}
                  </button>
                  <label
                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/40 hover:bg-sky-950/70 text-[#e7c878] border border-sky-800/40 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      uploadingId === s.id ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {uploadingId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {s.logo_url ? "Değiştir" : "Logo Yükle"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(s.id, file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={deletingId === s.id}
                    className="flex items-center justify-center w-9 h-9 bg-zinc-900/60 hover:bg-red-950/30 hover:text-red-400 hover:border-red-950/40 rounded-xl border border-zinc-800 text-zinc-500 transition-all disabled:opacity-50"
                    title="Sil"
                  >
                    {deletingId === s.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-4 text-center text-[10px] text-zinc-600">
        Destekleyen logoları ana sayfada otomatik gösterilir. Ana sponsor olarak
        işaretlenen tek sponsor, basılan yaka kartlarının sol altında yer alır.
      </footer>
    </div>
  );
}
