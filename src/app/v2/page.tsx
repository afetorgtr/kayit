"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  Calendar,
  Fingerprint,
  Briefcase,
  Building,
  Mail,
  Phone,
  Award,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Lock,
  Navigation,
  MessageSquare,
  Send,
  X,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { CONTACT_SUBJECTS, DEFAULT_CONTACT_SUBJECT } from "@/lib/contactSubjects";

// T.C. Kimlik No Validation Algorithm
function validateTCNo(tc: string): boolean {
  if (tc.length !== 11) return false;
  if (!/^\d+$/.test(tc)) return false;
  if (tc[0] === "0") return false;

  const digits = tc.split("").map(Number);

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  const expectedTenth = tenthDigit < 0 ? tenthDigit + 10 : tenthDigit;
  if (expectedTenth !== digits[9]) return false;

  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (totalSum % 10 !== digits[10]) return false;

  return true;
}

// Shared field styles for the navy + gold theme.
const HERO_FONT = "'Archivo Black', sans-serif";
const inputCls =
  "w-full bg-[#040a16]/80 border border-[#1b2c47] focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all text-slate-100 placeholder:text-slate-600";
const labelCls =
  "block text-[9px] lg:text-[10px] text-slate-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider";

export default function RegisterFormV2() {
  const [sponsors, setSponsors] = useState<
    { id: string; name: string; logo_url: string | null }[]
  >([]);

  useEffect(() => {
    fetch("/api/sponsors")
      .then((res) => (res.ok ? res.json() : { sponsors: [] }))
      .then((data) => setSponsors(data.sponsors || []))
      .catch(() => setSponsors([]));
  }, []);

  const [formData, setFormData] = useState({
    name_surname: "",
    birth_date: "",
    tc_no: "",
    profession: "",
    position: "",
    company: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData((prev) => ({ ...prev, tc_no: val }));
    if (errors.tc_no) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.tc_no;
        return next;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, phone: val }));
    if (errors.phone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_surname.trim()) newErrors.name_surname = "Ad Soyad gereklidir.";

    if (!formData.email.trim()) {
      newErrors.email = "E-posta adresi gereklidir.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Geçersiz e-posta adresi.";
    }

    if (!formData.phone) {
      newErrors.phone = "Cep telefonu gereklidir.";
    } else if (formData.phone.length < 10) {
      newErrors.phone = "Geçersiz cep telefonu numarası (örn: 5xx...)";
    }

    if (formData.tc_no && !validateTCNo(formData.tc_no)) {
      newErrors.tc_no = "Geçersiz T.C. Kimlik No.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Bir hata oluştu.");
      }

      setSuccess(true);
      setFormData({
        name_surname: "",
        birth_date: "",
        tc_no: "",
        profession: "",
        position: "",
        company: "",
        email: "",
        phone: "",
      });
    } catch (err: any) {
      setServerError(err.message || "Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // ---- İletişim (contact) modal ----
  const [contactOpen, setContactOpen] = useState(false);
  const [contactData, setContactData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    subject: DEFAULT_CONTACT_SUBJECT as string,
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  const closeContact = () => {
    setContactOpen(false);
    setContactSuccess(false);
    setContactError("");
    setContactData({
      first_name: "",
      last_name: "",
      phone: "",
      subject: DEFAULT_CONTACT_SUBJECT,
      message: "",
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");

    if (
      !contactData.first_name.trim() ||
      !contactData.last_name.trim() ||
      !contactData.phone.trim() ||
      !contactData.message.trim()
    ) {
      setContactError("Lütfen isim, soyisim, telefon ve mesaj alanlarını doldurun.");
      return;
    }

    setContactLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Mesaj gönderilemedi.");
      setContactSuccess(true);
    } catch (err: any) {
      setContactError(err.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setContactLoading(false);
    }
  };

  const announcements = [
    { label: "Bilgilendirme ve Davet Metni", href: "/duyuru-metni.pdf", icon: FileText },
    { label: "Bilgi Notu (30 Haziran 2026)", href: "/bilgi-notu.pdf", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070f1f] via-[#040a16] to-[#05101f] text-slate-100 flex flex-col items-center justify-between font-sans antialiased relative overflow-x-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Archivo+Black&display=swap');
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: laser-scan 9s linear infinite; }
        .tech-grid-blue {
          background-image:
            linear-gradient(to right, rgba(91, 192, 232, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(91, 192, 232, 0.035) 1px, transparent 1px);
          background-size: 52px 52px;
        }
      `,
        }}
      />

      {/* Background scene */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/afet-bg.png"
          alt="Afet ve Büyük Veri Yönetimi Arka Planı"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Navy scrims for legibility + cohesive blue tone */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040a16]/75 via-[#040a16]/45 to-[#040a16]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040a16]/70 via-transparent to-[#040a16]/40" />
        <div className="absolute inset-0 tech-grid-blue opacity-70" />
        {/* Gold scan line */}
        <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#e7c878]/40 to-transparent shadow-[0_0_15px_rgba(231,200,120,0.5)] animate-scan" />
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-gradient-to-b from-[#5bc0e8]/15 via-sky-500/5 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[320px] bg-gradient-to-t from-[#e7c878]/10 via-amber-500/5 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3 lg:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 border-b border-sky-900/20 backdrop-blur-sm bg-[#040a16]/30 z-10">
        <div className="flex items-center">
          <img
            src="/logo-yeni.png"
            alt="Afet Araştırmaları Derneği"
            className="h-9 md:h-11 w-auto object-contain max-w-[280px] md:max-w-[360px]"
          />
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-[11px] text-slate-400">
          <a
            href="mailto:bilgi@afet.org.tr"
            className="hidden sm:flex hover:text-[#e7c878] transition-colors items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e7c878]" /> bilgi@afet.org.tr
          </a>
          <a
            href="https://www.afet.org.tr"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex hover:text-[#e7c878] transition-colors items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e7c878]" /> afet.org.tr
          </a>
          <button
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e7c878]/10 hover:bg-[#e7c878]/20 text-[#e7c878] border border-[#e7c878]/40 rounded-xl text-[10px] md:text-[11px] font-bold transition-all"
          >
            <MessageSquare size={13} /> İletişim
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-7xl mx-auto px-6 py-2 lg:py-3.5 flex flex-col lg:flex-row gap-5 lg:gap-8 items-stretch flex-1 z-10 relative">
        {/* Left: Event details */}
        <div className="lg:flex-[1.25] flex flex-col justify-between gap-5 lg:gap-6 py-2">
          <div className="text-center lg:text-left">
            <h1 className="uppercase" style={{ fontFamily: HERO_FONT }}>
              <span className="block text-3xl md:text-4xl lg:text-[34px] xl:text-[44px] leading-none text-white">
                AFETLERDE
              </span>
              <span className="block text-[32px] md:text-5xl lg:text-[46px] xl:text-[56px] leading-[1.0] lg:leading-[0.98] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)] lg:whitespace-nowrap">
                BÜYÜK VERİ YÖNETİMİ
              </span>
            </h1>

            {/* Gold divider + flare */}
            <div className="relative h-[2px] w-[78%] max-w-[560px] mx-auto lg:mx-0 my-3.5 bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#c9a24b]/0">
              <span className="absolute left-[18%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-[radial-gradient(ellipse_at_center,rgba(255,244,214,0.85)_0%,rgba(231,200,120,0.35)_25%,transparent_70%)]" />
            </div>

            <span
              className="block text-xl md:text-2xl lg:text-[28px] tracking-[0.34em] text-transparent bg-clip-text bg-gradient-to-b from-[#f7e3a8] via-[#e7c878] to-[#c9a24b]"
              style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700 }}
            >
              SEMPOZYUMU
            </span>

            <p className="mt-5 text-slate-300 leading-relaxed text-xs md:text-sm lg:text-[15px] max-w-xl mx-auto lg:mx-0">
              Afet Araştırmaları Derneği tarafından{" "}
              <strong className="font-bold text-white">15–16 Ağustos 2026</strong> tarihlerinde
              Ankara Ticaret Odası Meclis Salonu'nda düzenlenecek sempozyumda; afet döngüsünün tüm
              aşamalarında büyük veri yönetimi stratejileri ve teknolojileri ele alınacaktır.
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <div className="p-3.5 bg-[#0a1426]/60 backdrop-blur-md rounded-2xl border border-sky-900/25 flex items-start gap-2.5 hover:border-[#5bc0e8]/30 transition-all">
              <Clock className="text-[#e7c878] shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">
                  Tarih & Saat
                </h4>
                <p className="text-xs md:text-sm font-bold mt-0.5">15 – 16 Ağustos 2026</p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">
                  Cumartesi – Pazar · 09:00 – 18:00
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-[#0a1426]/60 backdrop-blur-md rounded-2xl border border-sky-900/25 flex items-start gap-2.5 hover:border-[#5bc0e8]/30 transition-all">
              <MapPin className="text-[#e7c878] shrink-0 mt-0.5" size={18} />
              <div className="flex-1 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">
                    Etkinlik Yeri
                  </h4>
                  <p className="text-xs md:text-sm font-bold mt-0.5">ATO Meclis Salonu</p>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">Söğütözü, Ankara</p>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Ankara%20Ticaret%20Odas%C4%B1%20Meclis%20Salonu%2C%20S%C3%B6%C4%9F%C3%BCt%C3%B6z%C3%BC%2C%20%C3%87ankaya%2C%20Ankara"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-[#5bc0e8]/10 hover:bg-[#5bc0e8]/20 text-[#5bc0e8] border border-[#5bc0e8]/35 rounded-lg text-[10px] font-bold transition-all"
                >
                  <Navigation size={11} /> Yol Tarifi
                </a>
              </div>
            </div>
          </div>

          {/* Duyurular */}
          <div className="px-4 py-1.5 bg-[#0a1426]/55 backdrop-blur-md rounded-2xl border border-sky-900/25">
            <div className="divide-y divide-sky-900/15">
              {announcements.map((a) => {
                const Icon = a.icon;
                return (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 py-2.5 group"
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#e7c878]/10 border border-[#e7c878]/25 text-[#e7c878]">
                      <Icon size={15} />
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-slate-200 group-hover:text-white transition-colors">
                      {a.label}
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="text-[#e7c878] opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Support statement — bottom of the left column (original position) */}
          <div className="text-[10px] lg:text-[11px] text-slate-400 font-medium flex items-center gap-2.5 mt-auto">
            <img
              src="/sivil_toplum_logo3_beyaz.png"
              alt="T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü"
              className="h-[30px] md:h-9 w-auto object-contain shrink-0"
            />
            <span>
              Bu proje, T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü tarafından desteklenmektedir.
            </span>
          </div>
        </div>

        {/* Right: Registration form */}
        <div className="lg:flex-[1] min-w-0 flex flex-col">
          <div className="flex-1 p-3.5 md:p-4 lg:p-4 bg-[#0a1426]/70 backdrop-blur-2xl border border-sky-900/30 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#c9a24b]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#5bc0e8]/5 rounded-full blur-2xl pointer-events-none" />

            {success ? (
              <div className="text-center py-12 space-y-6 my-auto">
                <div className="w-16 h-16 bg-[#e7c878]/10 border border-[#e7c878]/30 rounded-full flex items-center justify-center mx-auto text-[#e7c878]">
                  <CheckCircle size={36} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black">Kayıt Başarılı!</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Kayıt işleminiz başarıyla tamamlandı. Yaka kartınız etkinlik girişinde adınıza
                    hazırlanıp teslim edilecektir.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 bg-[#e7c878]/10 hover:bg-[#e7c878]/20 text-[#e7c878] border border-[#e7c878]/25 rounded-xl text-xs font-bold transition-all"
                  >
                    Yeni Kayıt Ekle
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5 lg:space-y-3">
                  <div>
                    <h2 className="text-base lg:text-lg font-bold flex items-center gap-2">
                      Katılım Kayıt Formu
                    </h2>
                    <p className="text-[10px] lg:text-xs text-slate-400 mt-0.5">
                      Katılım ücretsizdir, kayıt zorunludur.
                    </p>
                  </div>

                  {serverError && (
                    <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="space-y-2 lg:space-y-2.5">
                    <div>
                      <label className={labelCls}>
                        Adınız, Soyadınız <span className="text-[#e7c878]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name_surname"
                          value={formData.name_surname}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Ad ve Soyad"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      </div>
                      {errors.name_surname && (
                        <p className="text-red-400 text-[10px] mt-0.5">{errors.name_surname}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                      <div>
                        <label className={labelCls}>
                          Doğum Tarihi{" "}
                          <span className="text-slate-600 normal-case font-medium">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleChange}
                            className={`${inputCls} text-slate-400`}
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>
                          T.C. Kimlik No{" "}
                          <span className="text-slate-600 normal-case font-medium">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="tc_no"
                            value={formData.tc_no}
                            onChange={handleTCChange}
                            maxLength={11}
                            className={`${inputCls} tracking-wider font-mono text-[#e7c878]`}
                            placeholder="11 haneli numara"
                          />
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                        {errors.tc_no && (
                          <p className="text-red-400 text-[10px] mt-0.5">{errors.tc_no}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>
                        Meslek{" "}
                        <span className="text-slate-600 normal-case font-medium">(opsiyonel)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="profession"
                          value={formData.profession}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Örn: Jeoloji Mühendisi, Veri Analisti"
                        />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                      <div>
                        <label className={labelCls}>
                          Çalıştığınız Kurum{" "}
                          <span className="text-slate-600 normal-case font-medium">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Kurum/Şirket Adı"
                          />
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>
                          Kurumsal Pozisyon{" "}
                          <span className="text-slate-600 normal-case font-medium">(opsiyonel)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Pozisyon/Unvan"
                          />
                          <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>
                        E-Posta Adresi <span className="text-[#e7c878]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="ahmet.yilmaz@afet.org.tr"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-[10px] mt-0.5">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>
                        Cep Telefonu <span className="text-[#e7c878]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength={11}
                          className={inputCls}
                          placeholder="05xxxxxxxxx"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-[10px] mt-0.5">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto pt-2 lg:pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#e7c878] hover:brightness-110 text-[#241a05] font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#e7c878]/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#241a05] border-t-transparent rounded-full animate-spin" />
                        Kayıt Alınıyor...
                      </>
                    ) : (
                      "Sempozyuma Kayıt Ol"
                    )}
                  </button>

                  <p className="text-[9px] lg:text-[10px] text-center text-slate-500 leading-normal flex items-center justify-center gap-1.5">
                    <Lock size={10} className="text-[#e7c878] shrink-0" />
                    Kayıt yaptırarak verilerinizin KVKK kapsamında organizasyon süreçlerinde
                    işlenmesini kabul etmiş olursunuz.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-sky-900/20 bg-[#040a16]/40 backdrop-blur-md py-3 text-center text-[10px] text-slate-500 z-10 space-y-2">
        {sponsors.length > 0 && (
          <div className="bg-white/95 py-2.5">
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 px-6">
              <span className="font-bold text-zinc-600 text-xs mr-1">Destekleyen:</span>
              {sponsors.map((s) =>
                s.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s.id}
                    src={s.logo_url}
                    alt={s.name}
                    title={s.name}
                    className="h-7 md:h-8 w-auto object-contain"
                  />
                ) : (
                  <span key={s.id} className="font-semibold text-xs text-zinc-700">
                    {s.name}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        <div className="border-t border-sky-900/10 pt-2.5 text-slate-600">
          © 2026 Afet Araştırmaları Derneği. Tüm hakları saklıdır.
        </div>
      </footer>

      {/* İletişim (Contact) Modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeContact}
        >
          <div
            className="w-full max-w-md bg-[#08111f] border border-sky-900/50 rounded-3xl shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5bc0e8]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-900/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e7c878]/10 border border-[#e7c878]/20 flex items-center justify-center text-[#e7c878]">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100">Bize Ulaşın</h3>
                  <p className="text-[10px] text-slate-400">Sorularınız için mesaj bırakın</p>
                </div>
              </div>
              <button
                onClick={closeContact}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {contactSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-[#e7c878]/10 border border-[#e7c878]/30 rounded-full flex items-center justify-center mx-auto text-[#e7c878]">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-slate-100">Mesajınız Alındı</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  En kısa sürede sizinle iletişime geçeceğiz. Teşekkür ederiz.
                </p>
                <button
                  onClick={closeContact}
                  className="mt-2 px-6 py-2 bg-[#e7c878]/10 hover:bg-[#e7c878]/20 text-[#e7c878] border border-[#e7c878]/25 rounded-xl text-xs font-bold transition-all"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-5 space-y-3">
                {contactError && (
                  <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} /> {contactError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={contactData.first_name}
                      onChange={(e) => setContactData((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="İsim"
                      className="w-full bg-[#040a16]/80 border border-sky-900/40 focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all text-slate-100 placeholder:text-slate-600"
                    />
                  </div>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={contactData.last_name}
                      onChange={(e) => setContactData((p) => ({ ...p, last_name: e.target.value }))}
                      placeholder="Soyisim"
                      className="w-full bg-[#040a16]/80 border border-sky-900/40 focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all text-slate-100 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) =>
                      setContactData((p) => ({ ...p, phone: e.target.value.replace(/[^\d+\s]/g, "") }))
                    }
                    placeholder="Telefon"
                    className="w-full bg-[#040a16]/80 border border-sky-900/40 focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                    Konu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTACT_SUBJECTS.map((subject) => (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => setContactData((p) => ({ ...p, subject }))}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-left ${
                          contactData.subject === subject
                            ? "bg-[#e7c878]/15 border-[#e7c878]/40 text-[#e7c878]"
                            : "bg-[#040a16]/60 border-sky-900/40 text-slate-400 hover:border-sky-800"
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={contactData.message}
                  onChange={(e) => setContactData((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Mesajınız..."
                  rows={4}
                  className="w-full bg-[#040a16]/80 border border-sky-900/40 focus:border-[#5bc0e8] focus:ring-1 focus:ring-[#5bc0e8]/25 rounded-xl py-2.5 px-3 text-[13px] outline-none transition-all resize-none text-slate-100 placeholder:text-slate-600"
                />

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#e7c878] hover:brightness-110 text-[#241a05] font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#e7c878]/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contactLoading ? (
                    <div className="w-4 h-4 border-2 border-[#241a05] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={14} /> Gönder
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
