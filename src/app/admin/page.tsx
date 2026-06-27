"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Download, 
  Printer, 
  Search, 
  Lock, 
  Unlock, 
  LogOut,
  Building,
  Building2,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  Fingerprint,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MessageSquare
} from "lucide-react";
import { PARTICIPANT_ROLES } from "@/lib/roles";

interface Registrant {
  id: string;
  name_surname: string;
  birth_date: string;
  tc_no: string;
  profession: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [nameSort, setNameSort] = useState<"asc" | "desc" | null>(null);
  const [contactUnread, setContactUnread] = useState(0);

  // Check session storage on mount
  useEffect(() => {
    const savedPassword = sessionStorage.getItem("admin_password");
    if (savedPassword) {
      verifyAndFetch(savedPassword);
    }
  }, []);

  const verifyAndFetch = async (pwdToVerify: string) => {
    setLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/registrants", {
        headers: {
          Authorization: pwdToVerify,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Hatalı şifre.");
      }

      const data = await res.json();
      setRegistrants(data.registrants || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_password", pwdToVerify);
      setPassword(pwdToVerify);

      // Pull the unread contact-message count for the header badge (best-effort).
      try {
        const cRes = await fetch("/api/admin/contact", { headers: { Authorization: pwdToVerify } });
        if (cRes.ok) {
          const cData = await cRes.json();
          setContactUnread((cData.messages || []).filter((m: { is_read?: boolean }) => !m.is_read).length);
        }
      } catch {
        // Non-critical: the badge simply won't show a count.
      }
    } catch (err: any) {
      setLoginError(err.message || "Giriş başarısız oldu.");
      sessionStorage.removeItem("admin_password");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    verifyAndFetch(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setRegistrants([]);
    setPassword("");
  };

  // Filter registrants based on search query
  const filteredRegistrants = registrants
    .filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.name_surname.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.tc_no || "").includes(q) ||
        (r.company || "").toLowerCase().includes(q) ||
        (r.profession || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (nameSort === null) return 0;
      const cmp = a.name_surname.localeCompare(b.name_surname, "tr");
      return nameSort === "asc" ? cmp : -cmp;
    });

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredRegistrants.length === 0) return;

    // CSV headers (use UTF-8 BOM to display Turkish characters correctly in Excel)
    const BOM = "\uFEFF";
    const headers = [
      "Adı Soyadı",
      "Doğum Tarihi",
      "T.C. Kimlik No",
      "Meslek",
      "Pozisyon",
      "Kurum",
      "E-Posta",
      "Telefon",
      "Kayıt Tarihi"
    ];

    const rows = filteredRegistrants.map((r) => [
      r.name_surname,
      r.birth_date,
      `'${r.tc_no}`, // Add single quote to prevent Excel truncation/sci notation
      r.profession,
      r.position,
      r.company,
      r.email,
      r.phone,
      new Date(r.created_at).toLocaleString("tr-TR")
    ]);

    const csvContent = 
      BOM +
      [headers.join(";"), ...rows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `afet_sempozyum_katilimcilar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const next: Record<string, boolean> = {};
      filteredRegistrants.forEach((r) => {
        next[r.id] = true;
      });
      setSelectedIds(next);
    } else {
      setSelectedIds({});
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const handlePrintSelected = () => {
    const ids = Object.keys(selectedIds);
    if (ids.length === 0) {
      alert("Lütfen yaka kartını yazdırmak istediğiniz katılımcıları seçin.");
      return;
    }
    // Store selected IDs and password in sessionStorage for the print page to fetch safely
    sessionStorage.setItem("print_ids", JSON.stringify(ids));
    window.open("/admin/print", "_blank");
  };

  const handlePrintAll = () => {
    if (filteredRegistrants.length === 0) return;
    const ids = filteredRegistrants.map((r) => r.id);
    sessionStorage.setItem("print_ids", JSON.stringify(ids));
    window.open("/admin/print", "_blank");
  };

  // Assign the badge role for a registrant (optimistic update, revert on failure).
  const handleRoleChange = async (id: string, role: string) => {
    if (!password) return;
    setRegistrants((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
    try {
      const res = await fetch(`/api/admin/registrants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: password },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Rol güncellenemedi.");
    } catch {
      verifyAndFetch(password);
    }
  };

  // Delete a registrant after confirmation.
  const handleDeleteRegistrant = async (id: string, name: string) => {
    if (!password) return;
    if (!window.confirm(`"${name}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    try {
      const res = await fetch(`/api/admin/registrants/${id}`, {
        method: "DELETE",
        headers: { Authorization: password },
      });
      if (!res.ok) throw new Error("Kayıt silinemedi.");
      setRegistrants((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      alert("Kayıt silinemedi. Lütfen tekrar deneyin.");
    }
  };

  // Stats Calculation
  const totalRegistrations = registrants.length;
  const uniqueCompanies = new Set(
    registrants.map((r) => (r.company || "").toLowerCase().trim()).filter(Boolean)
  ).size;
  const uniqueProfessions = new Set(
    registrants.map((r) => (r.profession || "").toLowerCase().trim()).filter(Boolean)
  ).size;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030908] text-zinc-100 flex items-center justify-center font-sans antialiased relative overflow-hidden px-6">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-950/15 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="w-full max-w-md p-8 bg-zinc-900/30 backdrop-blur-xl border border-emerald-950/40 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#8BE92C]">
              <Lock size={22} />
            </div>
            <h1 className="text-xl font-black">Yönetim Paneli Girişi</h1>
            <p className="text-xs text-zinc-400">Sempozyum yönetim sayfasına erişmek için şifreyi girin.</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 font-bold mb-1.5 uppercase tracking-wider">Yönetici Şifresi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2.5 px-4 text-sm outline-none transition-all text-center tracking-widest text-[#8BE92C] font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-zinc-950 font-extrabold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Unlock size={16} /> Paneli Aç
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030908] text-zinc-100 flex flex-col font-sans antialiased">
      {/* Admin Header */}
      <header className="w-full border-b border-emerald-950/30 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 md:h-12 flex items-center justify-center">
              <img
                src="/logo.png?v=12"
                alt="Afet Araştırmaları Derneği Logosu"
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="border-l border-emerald-950/20 pl-3 h-8 flex flex-col justify-center">
              <h1 className="text-xs font-black text-[#8BE92C] uppercase tracking-wider">Afet Araştırmaları Derneği</h1>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Kayıt Yönetim Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/contact")}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-400 rounded-xl border border-emerald-800/40 text-xs font-bold transition-all"
            >
              <MessageSquare size={14} /> İletişim Mesajları
              {contactUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#8BE92C] text-zinc-950 text-[10px] font-black rounded-full">
                  {contactUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/admin/sponsors")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-400 rounded-xl border border-emerald-800/40 text-xs font-bold transition-all"
            >
              <Building2 size={14} /> Destekleyenleri Yönet
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 hover:bg-red-950/20 hover:text-red-400 hover:border-red-950/40 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-bold transition-all"
            >
              <LogOut size={14} /> Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat 1 */}
          <div className="p-6 bg-zinc-900/20 backdrop-blur border border-zinc-800/40 rounded-2xl flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/30 border border-emerald-500/10 flex items-center justify-center text-[#8BE92C]">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Toplam Kayıtlı</h3>
              <p className="text-2xl font-black mt-1 text-[#8BE92C]">{totalRegistrations}</p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
              <Users size={96} />
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-6 bg-zinc-900/20 backdrop-blur border border-zinc-800/40 rounded-2xl flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/30 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Building size={24} />
            </div>
            <div>
              <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Farklı Kurumlar</h3>
              <p className="text-2xl font-black mt-1">{uniqueCompanies}</p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
              <Building size={96} />
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-6 bg-zinc-900/20 backdrop-blur border border-zinc-800/40 rounded-2xl flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/30 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Briefcase size={24} />
            </div>
            <div>
              <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Farklı Meslekler</h3>
              <p className="text-2xl font-black mt-1">{uniqueProfessions}</p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
              <Briefcase size={96} />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="İsim, e-posta, kurum, meslek veya TC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2 pl-10 pr-4 text-xs outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredRegistrants.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Excel/CSV İndir
            </button>
            <button
              onClick={handlePrintSelected}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-xl text-xs font-bold transition-all"
            >
              <Printer size={14} /> Seçilen Kartları Yazdır
            </button>
            <button
              onClick={handlePrintAll}
              disabled={filteredRegistrants.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} /> Tüm Kartları Yazdır
            </button>
          </div>
        </div>

        {/* Registrants Table Card */}
        <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-900">
                <tr>
                  <th className="py-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={filteredRegistrants.length > 0 && filteredRegistrants.every((r) => selectedIds[r.id])}
                      className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                    />
                  </th>
                  <th className="py-4 px-3 font-bold uppercase tracking-wider text-center w-12">No</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">
                    <button
                      onClick={() => setNameSort((s) => (s === "asc" ? "desc" : s === "desc" ? null : "asc"))}
                      className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Ada göre sırala"
                    >
                      Katılımcı Bilgileri
                      {nameSort === "asc" ? (
                        <ChevronUp size={12} className="text-[#8BE92C]" />
                      ) : nameSort === "desc" ? (
                        <ChevronDown size={12} className="text-[#8BE92C]" />
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">T.C. Kimlik / Yaş</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Kurum & Görev</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">İletişim</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Kayıt Tarihi</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Yaka Kartı Rolü</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {filteredRegistrants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-500">
                      Kayıtlı katılımcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrants.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-zinc-900/20 transition-colors ${selectedIds[r.id] ? "bg-emerald-950/5" : ""}`}
                    >
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[r.id]}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                        />
                      </td>
                      <td className="py-4 px-3 text-center text-zinc-500 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 font-semibold text-zinc-100">
                        {r.name_surname}
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Fingerprint size={12} className="text-zinc-600" />
                          <span>{r.tc_no || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-zinc-500">
                          <Calendar size={12} className="text-zinc-600" />
                          <span>{r.birth_date || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-zinc-300 font-medium">{r.company || "—"}</div>
                        <div className="text-zinc-500 mt-0.5">{[r.profession, r.position].filter(Boolean).join(" - ") || "—"}</div>
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Mail size={12} className="text-zinc-600" />
                          <span>{r.email}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-zinc-600" />
                          <span>{r.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-zinc-500">
                        {new Date(r.created_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={r.role || "Katılımcı"}
                          onChange={(e) => handleRoleChange(r.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-lg py-1.5 px-2 text-xs text-zinc-200 outline-none cursor-pointer transition-all"
                        >
                          {PARTICIPANT_ROLES.map((role) => (
                            <option key={role} value={role} className="bg-zinc-950">
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRegistrant(r.id, r.name_surname)}
                          className="inline-flex items-center justify-center w-9 h-9 bg-zinc-900/60 hover:bg-red-950/30 hover:text-red-400 hover:border-red-950/40 rounded-xl border border-zinc-800 text-zinc-500 transition-all"
                          title="Kaydı sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-4 text-center text-[10px] text-zinc-600">
        Sempozyum Kayıt Yönetim Sistemi v1.0.0
      </footer>
    </div>
  );
}
