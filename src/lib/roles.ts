// Participant roles printed on badges. The admin assigns these per registrant;
// the public registration form defaults everyone to "Katılımcı".
export const PARTICIPANT_ROLES = [
  'Katılımcı',
  'Konuşmacı',
  'Oturum Başkanı',
  'Moderatör',
  'Destekleyici Kurum Temsilcisi',
  'Düzenleme Kurulu',
  'Bilim Kurulu',
  'Organizasyon Ekibi',
  'Protokol',
  'Kurum Temsilcisi',
  'Sponsor',
  'Basın Mensubu',
] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const DEFAULT_ROLE: ParticipantRole = 'Katılımcı';

export function isValidRole(value: unknown): value is ParticipantRole {
  return typeof value === 'string' && (PARTICIPANT_ROLES as readonly string[]).includes(value);
}

// Solid badge band color per role (hex). The role band is the most prominent zone on
// the printed lanyard, so each role gets a distinct, white-text-legible color. Base
// palette follows the symposium spec; extra roles get distinct, equally dark hues.
export const ROLE_COLORS: Record<ParticipantRole, string> = {
  'Katılımcı': '#2563EB',                    // blue
  'Konuşmacı': '#DC2626',                    // red
  'Oturum Başkanı': '#1E3A8A',               // dark blue
  'Moderatör': '#7C3AED',                    // violet
  'Destekleyici Kurum Temsilcisi': '#0D9488', // teal
  'Düzenleme Kurulu': '#BE123C',             // rose
  'Bilim Kurulu': '#155E75',                 // cyan-800
  'Organizasyon Ekibi': '#374151',           // slate-gray
  'Protokol': '#D97706',                     // amber (VIP-tier)
  'Kurum Temsilcisi': '#4338CA',             // indigo
  'Sponsor': '#059669',                      // emerald
  'Basın Mensubu': '#EA580C',                // orange
};

const FALLBACK_ROLE_COLOR = ROLE_COLORS[DEFAULT_ROLE];

// Returns the badge band color for a role string, falling back to the default role color
// for unknown/empty values (e.g. legacy rows written before a role was assigned).
export function roleColor(role: string | null | undefined): string {
  if (role && isValidRole(role)) return ROLE_COLORS[role];
  return FALLBACK_ROLE_COLOR;
}
