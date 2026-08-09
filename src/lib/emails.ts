// Branded (navy + gold) transactional email templates for the symposium.
// Both share the same header/footer shell so they stay visually consistent with
// the site. Values are HTML-escaped before injection to avoid broken markup.

export const EVENT = {
  name: 'Afetlerde Büyük Veri Yönetimi Sempozyumu',
  dateRange: '15 – 16 Ağustos 2026',
  time: '09:00 – 18:00',
  venue: "Ankara Ticaret Odası Meclis Salonu, Söğütözü / Çankaya, Ankara",
  programUrl: 'https://www.afet.org.tr/wp-content/uploads/2026/08/buyukveriprogram.pdf',
  logoUrl: 'https://kayit.vercel.app/logo-yeni.png',
  website: 'https://www.afet.org.tr',
  contactOrg: 'Valör Organizasyon',
  contactEmail: 'buyukveri@valor.com.tr',
  contactPerson: 'Ömer Kazanoğlu',
  contactPhone: '0 (533) 591 47 10',
} as const;

// Optional fields we nudge participants to complete (badge-relevant). name/email/phone
// are already required at registration, so they never appear here.
export const OPTIONAL_FIELDS: { key: string; label: string }[] = [
  { key: 'company', label: 'Çalıştığınız Kurum' },
  { key: 'position', label: 'Göreviniz (Pozisyon)' },
  { key: 'profession', label: 'Meslek' },
];

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || String(v).trim() === '';
}

// Returns the human labels of the optional fields left blank for a registrant.
export function getMissingFieldLabels(r: Record<string, unknown>): string[] {
  return OPTIONAL_FIELDS.filter((f) => isEmpty(r[f.key])).map((f) => f.label);
}

// Returns the keys of the optional fields left blank (used for campaign tracking).
export function getMissingFieldKeys(r: Record<string, unknown>): string[] {
  return OPTIONAL_FIELDS.filter((f) => isEmpty(r[f.key])).map((f) => f.key);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shared shell: navy card with logo + event lockup header and support/contact footer.
function emailShell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:24px 0;background:#05070d;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070d;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#0a1426;border-radius:16px;overflow:hidden;border:1px solid #16233c;">

      <tr><td style="background:#071228;padding:30px 30px 26px;text-align:center;border-bottom:1px solid #16233c;">
        <img src="${EVENT.logoUrl}" alt="Afet Araştırmaları Derneği" width="210" style="display:block;margin:0 auto 18px;max-width:210px;height:auto;" />
        <div style="font-size:12px;font-weight:700;letter-spacing:5px;color:#e7c878;">AFETLERDE</div>
        <div style="font-size:27px;font-weight:800;letter-spacing:1px;color:#ffffff;margin-top:6px;">BÜYÜK VERİ YÖNETİMİ</div>
        <div style="height:2px;width:120px;margin:13px auto;background:#c9a24b;"></div>
        <div style="font-size:14px;font-weight:700;letter-spacing:8px;color:#e7c878;">SEMPOZYUMU</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#9fb0cc;margin-top:11px;">15 – 16 AĞUSTOS 2026 · ANKARA</div>
      </td></tr>

      <tr><td style="padding:34px 34px 30px;">${innerHtml}</td></tr>

      <tr><td style="background:#060c18;padding:24px 30px;text-align:center;border-top:1px solid #16233c;">
        <div style="font-size:11px;line-height:1.6;color:#8595b0;margin-bottom:14px;">Bu proje, T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü tarafından desteklenmektedir.</div>
        <div style="font-size:12px;font-weight:700;color:#c9d3e6;margin-bottom:3px;">İletişim</div>
        <div style="font-size:12px;line-height:1.7;color:#9fb0cc;">${EVENT.contactOrg} · <a href="mailto:${EVENT.contactEmail}" style="color:#e7c878;text-decoration:none;">${EVENT.contactEmail}</a><br>${EVENT.contactPerson} · ${EVENT.contactPhone}</div>
        <div style="margin-top:13px;"><a href="${EVENT.website}" style="color:#e7c878;text-decoration:none;font-size:12px;font-weight:700;">afet.org.tr</a></div>
        <div style="font-size:10px;color:#5d6b85;margin-top:14px;">© 2026 Afet Araştırmaları Derneği. Tüm hakları saklıdır.</div>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`;
}

function goldButton(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="${href}" style="display:inline-block;background:#e7c878;color:#241a05;font-size:14px;font-weight:800;text-decoration:none;padding:14px 30px;border-radius:10px;">${label}</a>
  </td></tr></table>`;
}

// 1) Registration confirmation.
export function renderConfirmationEmail(name: string): string {
  const safeName = escapeHtml(name || 'Katılımcımız');
  const inner = `
    <div style="width:60px;height:60px;line-height:60px;margin:0 auto 18px;background:#12233f;border:2px solid #e7c878;border-radius:30px;color:#e7c878;font-size:30px;font-weight:700;text-align:center;">&#10003;</div>
    <h1 style="font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 6px;">Kaydınız Alınmıştır</h1>
    <p style="font-size:14px;color:#9fb0cc;text-align:center;margin:0 0 24px;">Sempozyuma katılım kaydınız başarıyla oluşturuldu.</p>
    <p style="font-size:14px;line-height:1.7;color:#c6d2e6;margin:0 0 16px;">Sayın <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="font-size:14px;line-height:1.75;color:#aab6cc;margin:0 0 22px;">${EVENT.dateRange} tarihlerinde Ankara Ticaret Odası Meclis Salonu'nda düzenlenecek <strong style="color:#e7c878;">${EVENT.name}</strong>'na kaydınız tamamlanmıştır. Sizi aramızda görmekten mutluluk duyacağız.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08111f;border:1px solid #1b2c47;border-left:3px solid #e7c878;border-radius:12px;margin:0 0 22px;">
      <tr><td style="padding:16px 18px;font-size:13px;line-height:2;color:#aab6cc;">
        <strong style="color:#ffffff;">Tarih:</strong> ${EVENT.dateRange}<br>
        <strong style="color:#ffffff;">Saat:</strong> ${EVENT.time}<br>
        <strong style="color:#ffffff;">Yer:</strong> ${EVENT.venue}
      </td></tr>
    </table>
    <p style="font-size:13px;line-height:1.75;color:#aab6cc;margin:0 0 24px;">Yaka kartınız etkinlik girişinde adınıza hazırlanıp teslim edilecektir. Sempozyum boyunca yaka kartınızı takmanızı rica ederiz.</p>
    ${goldButton(EVENT.programUrl, 'Sempozyum Programını İnceleyiniz (PDF)')}`;
  return emailShell(inner);
}

// 2) Missing-info reminder — lists ONLY the fields actually left blank.
export function renderIncompleteEmail(name: string, missingLabels: string[], completeUrl: string): string {
  const safeName = escapeHtml(name || 'Katılımcımız');
  const items = (missingLabels.length ? missingLabels : ['Eksik bilgi bulunmuyor'])
    .map((l) => `&#9888;&nbsp; ${escapeHtml(l)}`)
    .join('<br>');
  const inner = `
    <div style="width:60px;height:60px;line-height:60px;margin:0 auto 18px;background:#12233f;border:2px solid #e7c878;border-radius:30px;color:#e7c878;font-size:30px;font-weight:700;text-align:center;">&#9998;</div>
    <h1 style="font-size:22px;font-weight:800;color:#ffffff;text-align:center;margin:0 0 6px;">Kurum ve Görev Bilgilerinizi Tamamlar mısınız?</h1>
    <p style="font-size:14px;color:#9fb0cc;text-align:center;margin:0 0 24px;">Sempozyuma yaşanan yoğun ilgi nedeniyle katılımcı bilgilerinin eksiksiz olması önem taşımaktadır.</p>
    <p style="font-size:14px;line-height:1.7;color:#c6d2e6;margin:0 0 16px;">Sayın <strong style="color:#ffffff;">${safeName}</strong>,</p>
    <p style="font-size:14px;line-height:1.75;color:#aab6cc;margin:0 0 20px;">Sempozyum kaydınız alınmıştır. Yoğun katılım nedeniyle katılımcı listesinin ve yaka kartlarınızın eksiksiz hazırlanabilmesi için aşağıdaki bilgileri tamamlamanızı rica ederiz:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08111f;border:1px solid #3a2f16;border-left:3px solid #e7c878;border-radius:12px;margin:0 0 22px;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:2.1;color:#e6c07a;font-weight:700;">${items}</td></tr>
    </table>
    <p style="font-size:13px;line-height:1.75;color:#aab6cc;margin:0 0 24px;">Bilgilerinizi aşağıdaki butondan birkaç saniyede güncelleyebilirsiniz. Katkınız için teşekkür ederiz.</p>
    ${goldButton(completeUrl, 'Bilgilerimi Tamamla')}
    <p style="font-size:12px;line-height:1.7;color:#7e8ca6;text-align:center;margin:22px 0 0;">Sempozyum programını incelemek için: <a href="${EVENT.programUrl}" style="color:#e7c878;text-decoration:none;font-weight:700;">Program (PDF)</a></p>`;
  return emailShell(inner);
}
