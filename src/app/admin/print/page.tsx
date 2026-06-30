"use client";

import { useState, useEffect } from "react";
import { Printer, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { roleColor } from "@/lib/roles";

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
}

interface BadgeSponsor {
  name: string;
  logo_url: string;
}

// A single 90×130 mm portrait lanyard card — clean navy + gold design matching the
// site: a built (not photographed) header with the AAD lockup and event title, a white
// participant frame, a color-coded role band, and a sponsor/AAD footer strip. The same
// markup is used for both on-screen preview and print.
function BadgeCard({ r, sponsor }: { r: Registrant; sponsor: BadgeSponsor | null }) {
  const secondary = [r.profession, r.position].filter(Boolean).join(" · ");
  const band = roleColor(r.role);

  return (
    <div className="badge-card relative overflow-hidden rounded-xl shadow-2xl print:shadow-none print:rounded-none flex flex-col bg-gradient-to-b from-[#0b1a33] via-[#071228] to-[#04060f]">
      {/* Header — AAD lockup + event title lockup */}
      <div className="relative px-4 pt-[7mm] pb-[4mm] text-center">
        {/* Top gold hairline accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#e7c878] to-transparent" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-yeni.png"
          alt="Afet Araştırmaları Derneği"
          className="h-[8mm] w-auto object-contain mx-auto mb-[4mm]"
        />
        <span className="block text-[11px] font-black uppercase tracking-[0.3em] text-white">AFETLERDE</span>
        <span className="block text-[24px] font-black uppercase leading-[1.0] text-white">BÜYÜK VERİ YÖNETİMİ</span>
        <div className="relative mx-auto my-[2mm] h-[1.5px] w-[78%] bg-gradient-to-r from-transparent via-[#e7c878] to-transparent" />
        <span className="block text-[12px] font-bold uppercase tracking-[0.42em] text-[#e7c878]">SEMPOZYUMU</span>
        <span className="block mt-[1.5mm] text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#e7c878]/85">
          15 – 16 Ağustos 2026 · Ankara
        </span>
      </div>

      {/* Participant — name inside a white frame */}
      <div className="relative flex-1 mx-[7%] mb-[3mm] bg-white rounded-2xl ring-1 ring-black/5 shadow-lg flex flex-col items-center justify-center text-center px-4 gap-2">
        <h1 className="text-[27px] leading-[1.03] font-black uppercase tracking-tight text-[#0a1426] break-words">
          {r.name_surname}
        </h1>
        {r.company && (
          <p className="text-[13px] font-bold text-zinc-600 leading-tight">{r.company}</p>
        )}
        {secondary && (
          <p className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-medium">{secondary}</p>
        )}
      </div>

      {/* Role band — full-bleed, color-coded, the distance-read element */}
      <div
        className="relative h-[10mm] flex items-center justify-center px-2 text-center text-white font-black uppercase text-[13px] tracking-[0.12em] leading-tight"
        style={{ backgroundColor: band }}
      >
        {r.role || "Katılımcı"}
      </div>

      {/* Footer — white strip: main sponsor left, AAD crow right */}
      <div className="relative h-[13mm] bg-white flex items-center justify-between px-[5mm]">
        {sponsor ? (
          <div className="flex flex-col items-start gap-0.5 max-w-[58%]">
            <span className="text-[6px] font-bold uppercase tracking-[0.14em] text-zinc-400 leading-none">
              Ana Sponsor
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sponsor.logo_url} alt={sponsor.name} title={sponsor.name} className="h-[7mm] max-w-[42mm] w-auto object-contain" />
          </div>
        ) : (
          <span />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/karga.png"
          alt="Afet Araştırmaları Derneği"
          className="h-[10mm] w-auto object-contain"
        />
      </div>
    </div>
  );
}

export default function PrintBadges() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [badgeSponsor, setBadgeSponsor] = useState<BadgeSponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSelectedRegistrants = async () => {
      const savedPassword = sessionStorage.getItem("admin_password");
      const savedIds = sessionStorage.getItem("print_ids");

      if (!savedPassword || !savedIds) {
        setError("Geçersiz oturum veya seçilmiş katılımcı yok. Lütfen yönetim panelinden tekrar deneyin.");
        setLoading(false);
        return;
      }

      try {
        const ids = JSON.parse(savedIds);
        if (!Array.isArray(ids) || ids.length === 0) {
          throw new Error("Seçili katılımcı bulunamadı.");
        }

        const res = await fetch("/api/admin/registrants/by-ids", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: savedPassword,
          },
          body: JSON.stringify({ ids }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Bilgiler yüklenemedi.");
        }

        const data = await res.json();
        setRegistrants(data.registrants || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Baskı verileri alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    // Resolve the single lanyard sponsor (must have a logo to be printable).
    const fetchBadgeSponsor = async () => {
      try {
        const res = await fetch("/api/sponsors");
        if (!res.ok) return;
        const data = await res.json();
        const found = (data.sponsors || []).find(
          (s: { is_badge_sponsor?: boolean; logo_url: string | null }) => s.is_badge_sponsor && s.logo_url
        );
        if (found) setBadgeSponsor({ name: found.name, logo_url: found.logo_url });
      } catch {
        // Sponsor is optional on the badge; ignore failures.
      }
    };

    fetchSelectedRegistrants();
    fetchBadgeSponsor();
  }, []);

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040a16] text-zinc-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#e7c878]" size={36} />
        <p className="text-xs text-zinc-400 font-medium">Baskı şablonu hazırlanıyor, lütfen bekleyin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#040a16] text-zinc-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="text-red-400" size={48} />
        <p className="text-sm font-semibold max-w-md">{error}</p>
        <button
          onClick={() => window.close()}
          className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold transition-all hover:bg-zinc-800"
        >
          Sekmeyi Kapat
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-900 font-sans antialiased">
      {/* Exact lanyard page size (90 × 130 mm) + print color fidelity */}
      <style dangerouslySetInnerHTML={{ __html: `
        .badge-card { width: 90mm; height: 130mm; }

        @page { size: 90mm 130mm; margin: 0; }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .badges-wrap {
            gap: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .badge-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            break-after: page;
            page-break-after: always;
            page-break-inside: avoid;
          }
          /* Force color backgrounds (role band, banner overlay) in print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Control bar (hidden on print) */}
      <div className="no-print bg-[#040a16] text-zinc-100 border-b border-sky-950/40 p-4 sticky top-0 z-50 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all border border-zinc-800"
          >
            <ArrowLeft size={14} /> Geri Dön
          </button>
          <div>
            <h1 className="text-xs font-bold">Yaka Kartı Baskı Önizleme</h1>
            <p className="text-[10px] text-zinc-400">
              {registrants.length} adet kart · 90 × 130 mm
              {badgeSponsor ? ` · Sponsor: ${badgeSponsor.name}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={triggerPrint}
          className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#c9a24b] via-[#f7e3a8] to-[#e7c878] hover:brightness-110 text-zinc-950 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-[#e7c878]/10"
        >
          <Printer size={16} /> Yazdır (Ctrl + P)
        </button>
      </div>

      {/* Badges — one card per registrant, each its own print page */}
      <div className="badges-wrap flex flex-col items-center py-8 gap-8 min-h-screen print:block">
        {registrants.map((r) => (
          <BadgeCard key={r.id} r={r} sponsor={badgeSponsor} />
        ))}
      </div>
    </div>
  );
}
