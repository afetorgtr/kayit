import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { REGISTRATION_CAP, isUncappedHost } from '@/lib/capacity';

// Public: tells the homepage whether registration is still open. Returns only a boolean
// (no participant count is exposed) so the form area can switch to the "full" message.
export async function GET(request: Request) {
  // Door-registration mirror (yedekkayit.vercel.app) is always open — on-site walk-in
  // registration at the venue entrance must never be blocked by the cap.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (isUncappedHost(host)) {
    return NextResponse.json({ open: true, uncapped: true });
  }

  const { count, error } = await supabaseAdmin
    .from('registrants')
    .select('*', { count: 'exact', head: true });

  // Fail open: if the count can't be read, keep the form available (server-side cap in
  // /api/register is the real guard against exceeding the limit).
  if (error) {
    console.error('Capacity count error:', error);
    return NextResponse.json({ open: true });
  }

  return NextResponse.json({ open: (count || 0) < REGISTRATION_CAP });
}
