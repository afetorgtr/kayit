// Single source of truth for the registration cap. When the number of registrants
// reaches this, new registrations are closed (server-side + on the homepage).
export const REGISTRATION_CAP = 250;

// Door-registration mirror(s): these hosts ALWAYS keep registration open, bypassing the
// cap. Used at the venue entrance on the event day for on-site / walk-in registration,
// while the main site (kayit.vercel.app) stays closed once the cap is reached.
export const UNCAPPED_HOSTS = ['yedekkayit.vercel.app'];

// Matches the request Host against the uncapped list (case-insensitive, port/CSV-safe).
export function isUncappedHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.split(',')[0].split(':')[0].trim().toLowerCase();
  return UNCAPPED_HOSTS.includes(h);
}
