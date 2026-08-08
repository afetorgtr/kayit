import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { REGISTRATION_CAP } from '@/lib/capacity';

// Public: tells the homepage whether registration is still open. Returns only a boolean
// (no participant count is exposed) so the form area can switch to the "full" message.
export async function GET() {
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
