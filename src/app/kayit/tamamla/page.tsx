"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Fingerprint,
  Calendar,
  Briefcase,
  Building,
  Award,
  Mail,
  CheckCircle,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

interface Form {
  name_surname: string;
  email: string;
  phone: string;
  tc_no: string;
  birth_date: string;
  profession: string;
  position: string;
  company: string;
}

const EMPTY: Form = {
  name_surname: "",
  email: "",
  phone: "",
  tc_no: "",
  birth_date: "",
  profession: "",
  position: "",
  company: "",
};

const inputCls =
  "w-full bg-[#040a16]/80 border rounded-xl py-2 pl-9 pr-4 text-[13px] outline-none transition-all text-slate-100 placeholder:text-slate-600 focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25";

export default function CompleteRegistration() {
  const [id, setId] = useState("");
  const [token, setToken] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qid = params.get("id") || "";
    const qt = params.get("t") || "";
    setId(qid);
    setToken(qt);

    if (!qid || !qt) {
      setError("Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı kullanın.");
      setLoading(false);
      return;
    }

    fetch(`/api/kayit/tamamla?id=${encodeURIComponent(qid)}&t=${encodeURIComponent(qt)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Kayıt yüklenemedi.");
        const r = data.registrant;
        const next: Form = {
          name_surname: r.name_surname || "",
          email: r.email || "",
          phone: r.phone || "",
          tc_no: r.tc_no || "",
          birth_date: r.birth_date || "",
          profession: r.profession || "",
          position: r.position || "",
          company: r.company || "",
        };
        setForm(next);
        setMissing({
          tc_no: !next.tc_no,
          company: !next.company,
          profession: !next.profession,
          position: !next.position,
        });
      })
      .catch((err) => setError(err.message || "Bir hata oluştu."))
      .finally(() => setLoading(false));
  }, []);

  const border = (key: keyof Form) =>
    missing[key] ? "border-[#e7c878]/60" : "border-sky-900/40";

  const set = (key: keyof Form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name_surname.trim()) return setError("Ad Soyad boş bırakılamaz.");
    if (!form.phone.trim()) return setError("Telefon boş bırakılamaz.");

    setSaving(true);
    try {
      const res = await fetch("/api/kayit/tamamla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          t: token,
          name_surname: form.name_surname,
          phone: form.phone,
          tc_no: form.tc_no,
          birth_date: form.birth_date,
          profession: form.profession,
          position: form.position,
          company: form.company,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Güncellenemedi.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070f1f] via-[#040a16] to-[#05101f] text-slate-100 font-sans antialiased flex flex-col items-center px-4 py-10">
      <img
        src="/logo-yeni.png"
        alt="Afet Araştırmaları Derneği"
        className="h-10 md:h-12 w-auto object-contain mb-6"
      />

      <div className="w-full max-w-lg bg-[#0a1426]/70 backdrop-blur-2xl border border-sky-900/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#c9a24b]" />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="animate-spin text-[#e7c878]" size={32} />
            <p className="text-xs text-slate-400">Bilgileriniz yükleniyor...</p>
          </div>
        ) : success ? (
          <div className="text-center py-16 px-6 space-y-4">
            <div className="w-16 h-16 bg-[#e7c878]/10 border border-[#e7c878]/30 rounded-full flex items-center justify-center mx-auto text-[#e7c878]">
              <CheckCircle size={34} />
            </div>
            <h1 className="text-2xl font-black">Bilgileriniz Güncellendi</h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Katkınız için teşekkür ederiz. Yaka kartınız güncel bilgilerinizle hazırlanacaktır.
            </p>
          </div>
        ) : error && !form.email ? (
          <div className="text-center py-16 px-6 space-y-4">
            <div className="w-14 h-14 bg-red-950/30 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={30} />
            </div>
            <h1 className="text-lg font-bold">Bağlantı Geçersiz</h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">{error}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <h1 className="text-lg font-bold">Kayıt Bilgilerinizi Tamamlayın</h1>
              <p className="text-[11px] text-slate-400 mt-1">
                Altın renkle işaretli alanlar eksik. Yaka kartınızın eksiksiz hazırlanabilmesi için
                lütfen doldurunuz.
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                E-Posta (değiştirilemez)
              </label>
              <div className="relative">
                <input value={form.email} disabled className={`${inputCls} border-sky-900/40 opacity-60 cursor-not-allowed`} />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Adınız, Soyadınız <span className="text-[#e7c878]">*</span>
              </label>
              <div className="relative">
                <input value={form.name_surname} onChange={(e) => set("name_surname", e.target.value)} placeholder="Ad ve Soyad" className={`${inputCls} border-sky-900/40`} />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                  Telefon <span className="text-[#e7c878]">*</span>
                </label>
                <div className="relative">
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d+\s]/g, ""))} placeholder="05xxxxxxxxx" className={`${inputCls} ${border("phone")}`} />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                  T.C. Kimlik No {missing.tc_no && <span className="text-[#e7c878] normal-case">(eksik)</span>}
                </label>
                <div className="relative">
                  <input value={form.tc_no} onChange={(e) => set("tc_no", e.target.value.replace(/\D/g, "").slice(0, 11))} maxLength={11} placeholder="11 haneli" className={`${inputCls} ${border("tc_no")} font-mono text-[#e7c878]`} />
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Doğum Tarihi
              </label>
              <div className="relative">
                <input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} className={`${inputCls} border-sky-900/40 text-slate-400`} />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Meslek {missing.profession && <span className="text-[#e7c878] normal-case">(eksik)</span>}
              </label>
              <div className="relative">
                <input value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Örn: Jeoloji Mühendisi" className={`${inputCls} ${border("profession")}`} />
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                  Kurum {missing.company && <span className="text-[#e7c878] normal-case">(eksik)</span>}
                </label>
                <div className="relative">
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Kurum/Şirket" className={`${inputCls} ${border("company")}`} />
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                  Pozisyon {missing.position && <span className="text-[#e7c878] normal-case">(eksik)</span>}
                </label>
                <div className="relative">
                  <input value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Unvan" className={`${inputCls} ${border("position")}`} />
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#e7c878] hover:brightness-110 text-[#241a05] font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#e7c878]/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Kaydediliyor...
                </>
              ) : (
                <>
                  <Save size={14} /> Bilgilerimi Kaydet
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="text-[10px] text-slate-600 mt-6">© 2026 Afet Araştırmaları Derneği</p>
    </div>
  );
}
