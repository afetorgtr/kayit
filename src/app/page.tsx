"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import DataNetwork from "@/components/DataNetwork";
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
  X
} from "lucide-react";
import { CONTACT_SUBJECTS, DEFAULT_CONTACT_SUBJECT } from "@/lib/contactSubjects";

// T.C. Kimlik No Validation Algorithm
function validateTCNo(tc: string): boolean {
  if (tc.length !== 11) return false;
  if (!/^\d+$/.test(tc)) return false;
  if (tc[0] === '0') return false;

  const digits = tc.split('').map(Number);
  
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  const expectedTenth = tenthDigit < 0 ? tenthDigit + 10 : tenthDigit;
  if (expectedTenth !== digits[9]) return false;

  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (totalSum % 10 !== digits[10]) return false;

  return true;
}

export default function RegisterForm() {

  const [sponsors, setSponsors] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);

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

    // Required fields: name, email, phone
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

    // Optional T.C. Kimlik No — validate only when provided
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
    // Reset to a clean slate so reopening doesn't show a stale success/error state.
    setContactSuccess(false);
    setContactError("");
    setContactData({ first_name: "", last_name: "", phone: "", subject: DEFAULT_CONTACT_SUBJECT, message: "" });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#051c19] via-[#020b0a] to-[#061917] text-zinc-100 flex flex-col items-center justify-between font-sans antialiased relative overflow-x-hidden transition-all duration-700">
      
      {/* Dynamic Style Injection for Futuristic Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-4deg); }
        }
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.02); opacity: 0.3; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        @keyframes slow-bg-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-spin-slow {
          animation: spin-slow 40s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 30s linear infinite;
        }
        .animate-float-slow {
          animation: float-slow 7s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 9s ease-in-out infinite;
        }
        .animate-scan {
          animation: laser-scan 8s linear infinite;
        }
        .animate-pulse-glow {
          animation: slow-bg-glow 6s ease-in-out infinite;
        }
        
        .tech-grid {
          background-image: 
            linear-gradient(to right, rgba(139, 233, 44, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 233, 44, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .glow-neon-text {
          text-shadow: 0 0 10px rgba(139, 233, 44, 0.3), 0 0 20px rgba(16, 185, 129, 0.2);
        }
      `}} />

      {/* ---------------------------------------------------- */}
      {/* BACKGROUND THEME RENDERER (SİBER GRİD ONLY) */}
      {/* ---------------------------------------------------- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700">
        
        <div className="absolute inset-0 transition-all duration-700">
          {/* Main background scene — disaster + big-data themed full-bleed image */}
          <div className="absolute inset-0">
            <Image src="/afet-bg.png" alt="Afet ve Büyük Veri Yönetimi Arka Planı" fill className="object-cover object-center" priority />
            {/* Dark scrims keep overlaid hero text and form legible over the busy scene */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020b0a]/70 via-[#020b0a]/40 to-[#020b0a]/85" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020b0a]/65 via-transparent to-[#020b0a]/35" />
          </div>
          <div className="absolute inset-0 tech-grid opacity-60" />
          <DataNetwork />
          <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8BE92C]/40 to-transparent shadow-[0_0_15px_rgba(139,233,44,0.6)] animate-scan" />

          {/* Radar / HUD SVG Circles */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.22] hidden lg:block">
            <svg className="w-full h-full animate-spin-slow" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#8BE92C" strokeWidth="0.5" strokeDasharray="5,10" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="#10B981" strokeWidth="0.75" strokeDasharray="40,15,5,15" />
            </svg>
          </div>

          {/* Rich Glows simulating the poster dome and water reflections */}
          {/* Top central bright dome glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#8BE92C]/25 via-emerald-500/10 to-transparent rounded-full blur-[110px]" />
          {/* Sky glow (cyan/blue) simulating satellite signals and city lights */}
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px]" />
          {/* Bottom water reflection glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-t from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-[100px]" />
        </div>

        {/* 4. Active Technology SVGs - Drone & Satellite Floating Objects */}
        {/* Floating Satellite (Top Right) */}
        <div className="absolute top-[12%] right-[8%] w-48 h-32 opacity-[0.25] animate-float-slow hidden md:block">
          <svg viewBox="0 0 100 80" className="w-full h-full text-[#8BE92C]" fill="none" stroke="currentColor" strokeWidth="0.75">
            <rect x="42" y="32" width="16" height="16" rx="2" />
            <circle cx="50" cy="40" r="4" />
            <line x1="10" y1="40" x2="42" y2="40" />
            <rect x="15" y="30" width="8" height="20" />
            <rect x="27" y="30" width="8" height="20" />
            <line x1="58" y1="40" x2="90" y2="40" />
            <rect x="65" y="30" width="8" height="20" />
            <rect x="77" y="30" width="8" height="20" />
            <line x1="50" y1="48" x2="50" y2="60" />
            <path d="M 44,60 Q 50,65 56,60" />
            <path d="M 40,68 Q 50,75 60,68" strokeDasharray="2,2" />
          </svg>
        </div>

        {/* Floating Drone (Bottom Left) */}
        <div className="absolute bottom-[15%] left-[6%] w-48 h-36 opacity-[0.22] animate-float-slower hidden md:block">
          <svg viewBox="0 0 100 80" className="w-full h-full text-emerald-400" fill="none" stroke="currentColor" strokeWidth="0.75">
            <path d="M 30,40 L 70,40 M 50,25 L 50,55 M 35,28 L 65,52 M 35,52 L 65,28" />
            <circle cx="50" cy="40" r="6" fill="#020706" />
            <circle cx="50" cy="40" r="3" fill="#8BE92C" />
            <circle cx="35" cy="28" r="4" />
            <line x1="30" y1="28" x2="40" y2="28" />
            <circle cx="65" cy="28" r="4" />
            <line x1="60" y1="28" x2="70" y2="28" />
            <circle cx="35" cy="52" r="4" />
            <line x1="30" y1="52" x2="40" y2="52" />
            <circle cx="65" cy="52" r="4" />
            <line x1="60" y1="52" x2="70" y2="52" />
            <rect x="46" y="46" width="8" height="8" rx="1" />
            <circle cx="50" cy="50" r="2" />
          </svg>
        </div>
      </div>

      {/* Main Header / Logo Section */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3 lg:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 border-b border-emerald-950/20 backdrop-blur-sm bg-[#030908]/20 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 md:h-11 flex items-center justify-center">
            <img
              src="/logo.png?v=12"
              alt="Afet Araştırmaları Derneği Logosu"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="md:border-l md:border-emerald-950/20 md:pl-3 flex items-center">
            <h2 className="text-[11px] md:text-sm tracking-wide text-emerald-400 font-black uppercase">Afet Araştırmaları Derneği</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-[11px] text-zinc-400">
          <a href="mailto:bilgi@afet.org.tr" className="hidden sm:flex hover:text-[#8BE92C] transition-colors items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> bilgi@afet.org.tr
          </a>
          <a href="https://www.afet.org.tr" target="_blank" rel="noreferrer" className="hidden sm:flex hover:text-[#8BE92C] transition-colors items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> afet.org.tr
          </a>
          <button
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 text-[#8BE92C] border border-emerald-800/40 rounded-xl text-[10px] md:text-[11px] font-bold transition-all"
          >
            <MessageSquare size={13} /> İletişim
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="w-full max-w-7xl mx-auto px-6 py-2 lg:py-3.5 flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch flex-1 z-10 relative">
        
        {/* Left Side: Event Details */}
        <div className="flex-1 flex flex-col justify-between space-y-6 lg:space-y-8 py-2">
          <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
            <h1 className="font-black tracking-tight leading-[1.02] uppercase">
              <span className="block text-2xl md:text-3xl lg:text-[30px] xl:text-[34px] text-zinc-200">AFETLERDE</span>
              <span className="block my-0.5 text-transparent bg-clip-text bg-gradient-to-r from-[#8BE92C] to-emerald-400 glow-neon-text text-5xl md:text-6xl lg:text-[62px] xl:text-[72px]">
                BÜYÜK VERİ YÖNETİMİ
              </span>
              <span className="block text-2xl md:text-3xl lg:text-[30px] xl:text-[34px] text-zinc-200">SEMPOZYUMU</span>
            </h1>
            
            <p className="text-zinc-300 leading-relaxed text-xs md:text-sm lg:text-base">
              Afet Araştırmaları Derneği tarafından <strong className="font-bold text-zinc-100">15-16 Ağustos 2026</strong> tarihlerinde Ankara Ticaret Odası Meclis Salonu'nda düzenlenecek olan sempozyumumuzda, modern teknolojiler ve büyük veri yönetimi çözümleri derinlemesine ele alınacaktır.
            </p>
          </div>

          {/* Supported Statement — hero text ile kartlar arasında dikeyde ortalı, sola yaslı */}
          <div className="text-[9px] md:text-[10px] lg:text-[11px] text-zinc-400 font-medium flex items-center gap-2.5">
            <img
              src="/sivil_toplum_logo3_beyaz.png"
              alt="T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü"
              className="h-[30px] md:h-9 w-auto object-contain shrink-0"
            />
            <span>T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü <br className="hidden lg:inline" /> tarafından desteklenmektedir.</span>
          </div>

          {/* Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mt-auto">
            <div className="p-3.5 bg-zinc-950/50 backdrop-blur-md rounded-2xl border border-zinc-800/10 flex items-start gap-2.5 hover:border-emerald-500/20 transition-all">
              <MapPin className="text-[#8BE92C] shrink-0 mt-0.5" size={18} />
              <div className="flex-1 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Etkinlik Yeri</h4>
                  <p className="text-xs md:text-sm font-bold mt-0.5">ATO Meclis Salonu</p>
                  <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">Söğütözü, Ankara</p>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Ankara%20Ticaret%20Odas%C4%B1%20Meclis%20Salonu%2C%20S%C3%B6%C4%9F%C3%BCt%C3%B6z%C3%BC%2C%20%C3%87ankaya%2C%20Ankara"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 text-[#8BE92C] border border-emerald-800/40 rounded-lg text-[10px] font-bold transition-all"
                >
                  <Navigation size={11} /> Yol Tarifi
                </a>
              </div>
            </div>
            <div className="p-3.5 bg-zinc-950/50 backdrop-blur-md rounded-2xl border border-zinc-800/10 flex items-start gap-2.5 hover:border-emerald-500/20 transition-all">
              <Clock className="text-[#8BE92C] shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Tarih & Saat</h4>
                <p className="text-xs md:text-sm font-bold mt-0.5">15 - 16 Ağustos 2026</p>
                <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">Cumartesi - Pazar, 09:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form Card */}
        <div className="flex-1 flex flex-col pt-0">
          <div className="flex-1 p-3.5 md:p-4 lg:p-5 bg-zinc-950/70 backdrop-blur-2xl border border-emerald-950/30 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {success ? (
              <div className="text-center py-12 space-y-6 my-auto">
                <div className="w-16 h-16 bg-emerald-950/30 border border-[#8BE92C]/30 rounded-full flex items-center justify-center mx-auto text-[#8BE92C]">
                  <CheckCircle size={36} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black">Kayıt Başarılı!</h2>
                  <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                    Kayıt işleminiz başarıyla tamamlandı. Yaka kartınız etkinlik girişinde adınıza hazırlanıp teslim edilecektir.
                  </p>
                </div>
                <div className="pt-4">
                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 bg-emerald-950/40 hover:bg-emerald-950/60 text-[#8BE92C] border border-[#8BE92C]/20 rounded-xl text-xs font-bold transition-all"
                  >
                    Yeni Kayıt Ekle
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h2 className="text-base lg:text-lg font-bold flex items-center gap-2">
                      Katılım Kayıt Formu
                    </h2>
                    <p className="text-[10px] lg:text-xs text-zinc-400 mt-0.5">Katılımcı yaka kartı bilgileri için formu doldurunuz.</p>
                  </div>

                  {serverError && (
                    <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 lg:space-y-3.5">
                    {/* Name Surname */}
                    <div>
                      <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Adınız, Soyadınız <span className="text-emerald-400">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name_surname"
                          value={formData.name_surname}
                          onChange={handleChange}
                          className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                          placeholder="Ad ve Soyad"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      </div>
                      {errors.name_surname && <p className="text-red-400 text-[10px] mt-0.5">{errors.name_surname}</p>}
                    </div>

                    {/* Two Column Row: Birthdate & TC ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                      {/* Birth Date */}
                      <div>
                        <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Doğum Tarihi <span className="text-zinc-600 normal-case font-medium">(opsiyonel)</span></label>
                        <div className="relative">
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleChange}
                            className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all text-zinc-400"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        </div>
                        {errors.birth_date && <p className="text-red-400 text-[10px] mt-0.5">{errors.birth_date}</p>}
                      </div>

                      {/* TC ID */}
                      <div>
                        <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">T.C. Kimlik No <span className="text-zinc-600 normal-case font-medium">(opsiyonel)</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="tc_no"
                            value={formData.tc_no}
                            onChange={handleTCChange}
                            maxLength={11}
                            className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all tracking-wider font-mono text-[#8BE92C]"
                            placeholder="11 haneli numara"
                          />
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        </div>
                        {errors.tc_no && <p className="text-red-400 text-[10px] mt-0.5">{errors.tc_no}</p>}
                      </div>
                    </div>

                    {/* Profession */}
                    <div>
                      <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Meslek <span className="text-zinc-600 normal-case font-medium">(opsiyonel)</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          name="profession"
                          value={formData.profession}
                          onChange={handleChange}
                          className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                          placeholder="Örn: Jeoloji Mühendisi, Veri Analisti"
                        />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      </div>
                      {errors.profession && <p className="text-red-400 text-[10px] mt-0.5">{errors.profession}</p>}
                    </div>

                    {/* Two Column Row: Company & Position */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                      {/* Company */}
                      <div>
                        <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Çalıştığınız Kurum <span className="text-zinc-600 normal-case font-medium">(opsiyonel)</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                            placeholder="Kurum/Şirket Adı"
                          />
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        </div>
                        {errors.company && <p className="text-red-400 text-[10px] mt-0.5">{errors.company}</p>}
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Kurumsal Pozisyon <span className="text-zinc-600 normal-case font-medium">(opsiyonel)</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                            placeholder="Pozisyon/Unvan"
                          />
                          <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        </div>
                        {errors.position && <p className="text-red-400 text-[10px] mt-0.5">{errors.position}</p>}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">E-Posta Adresi <span className="text-emerald-400">*</span></label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                          placeholder="ahmet.yilmaz@afet.org.tr"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      </div>
                      {errors.email && <p className="text-red-400 text-[10px] mt-0.5">{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[9px] lg:text-[10px] text-zinc-400 font-bold mb-0.5 lg:mb-1 uppercase tracking-wider">Cep Telefonu <span className="text-emerald-400">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength={11}
                          className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-1.5 lg:py-2 pl-9 pr-4 text-xs lg:text-[13px] outline-none transition-all"
                          placeholder="05xxxxxxxxx"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      </div>
                      {errors.phone && <p className="text-red-400 text-[10px] mt-0.5">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto pt-2 lg:pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-zinc-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        Kayıt Alınıyor...
                      </>
                    ) : (
                      "Sempozyuma Kayıt Ol"
                    )}
                  </button>

                  <p className="text-[9px] lg:text-[10px] text-center text-zinc-500 leading-normal flex items-center justify-center gap-1.5 whitespace-normal lg:whitespace-nowrap">
                    <Lock size={10} className="text-emerald-500 shrink-0" />
                    Kayıt yaptırarak verilerinizin KVKK kapsamında organizasyon süreçlerinde işlenmesini kabul etmiş olursunuz.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

      </main>

      {/* Footer Logo Grid & Info */}
      <footer className="w-full border-t border-emerald-950/20 bg-zinc-950/30 backdrop-blur-md py-3 text-center text-[10px] text-zinc-500 z-10 space-y-2">
        {/* Destekleyen kurumlar — admin panelinden dinamik gelir */}
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
        
        <div className="border-t border-emerald-950/10 pt-2.5 text-zinc-600">
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
            className="w-full max-w-md bg-[#071513] border border-emerald-950/50 rounded-3xl shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/40 border border-[#8BE92C]/20 flex items-center justify-center text-[#8BE92C]">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-100">Bize Ulaşın</h3>
                  <p className="text-[10px] text-zinc-400">Sorularınız için mesaj bırakın</p>
                </div>
              </div>
              <button
                onClick={closeContact}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {contactSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-950/40 border border-[#8BE92C]/30 rounded-full flex items-center justify-center mx-auto text-[#8BE92C]">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-zinc-100">Mesajınız Alındı</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  En kısa sürede sizinle iletişime geçeceğiz. Teşekkür ederiz.
                </p>
                <button
                  onClick={closeContact}
                  className="mt-2 px-6 py-2 bg-emerald-950/40 hover:bg-emerald-950/60 text-[#8BE92C] border border-[#8BE92C]/20 rounded-xl text-xs font-bold transition-all"
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
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="text"
                      value={contactData.first_name}
                      onChange={(e) => setContactData((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="İsim"
                      className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="text"
                      value={contactData.last_name}
                      onChange={(e) => setContactData((p) => ({ ...p, last_name: e.target.value }))}
                      placeholder="Soyisim"
                      className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) =>
                      setContactData((p) => ({ ...p, phone: e.target.value.replace(/[^\d+\s]/g, "") }))
                    }
                    placeholder="Telefon"
                    className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2 pl-9 pr-3 text-[13px] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">
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
                            ? "bg-emerald-950/50 border-[#8BE92C]/40 text-[#8BE92C]"
                            : "bg-zinc-950/60 border-zinc-800/70 text-zinc-400 hover:border-zinc-700"
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
                  className="w-full bg-zinc-950/80 border border-zinc-800/70 focus:border-[#8BE92C] focus:ring-1 focus:ring-[#8BE92C]/20 rounded-xl py-2.5 px-3 text-[13px] outline-none transition-all resize-none"
                />

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-zinc-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contactLoading ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
