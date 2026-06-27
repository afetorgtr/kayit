// Predefined subjects for the public contact form. Keeping them in one shared
// constant lets the homepage form, the API validator and the admin view stay in
// sync — a visitor can only pick one of these, so the admin can filter/triage
// incoming messages by a known set of categories.
export const CONTACT_SUBJECTS = [
  'Kayıt ve Katılım',
  'Sponsorluk ve Destek',
  'Konuşmacı ve Bildiri',
  'Genel Bilgi ve Diğer',
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const DEFAULT_CONTACT_SUBJECT: ContactSubject = 'Genel Bilgi ve Diğer';

export function isValidSubject(value: unknown): value is ContactSubject {
  return typeof value === 'string' && (CONTACT_SUBJECTS as readonly string[]).includes(value);
}
