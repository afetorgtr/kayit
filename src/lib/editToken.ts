import crypto from 'crypto';

// Stateless per-registrant edit token (HMAC of the id). Lets a participant open their
// own "complete your info" page from an email link without a login, while preventing
// anyone from editing another registrant by guessing ids. No DB column needed.
const SECRET =
  process.env.EDIT_TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'afet-edit-secret-2026';

export function makeEditToken(id: string): string {
  return crypto.createHmac('sha256', SECRET).update(String(id)).digest('hex').slice(0, 40);
}

export function verifyEditToken(id: string, token: string): boolean {
  if (!id || !token) return false;
  const expected = makeEditToken(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
