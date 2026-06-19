import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public endpoint: returns all sponsors for the footer.
// Footer renders the logo when available, otherwise the name as text.
export async function GET() {
  try {
    // select('*') (rather than an explicit column list) keeps this public endpoint
    // working even before the is_badge_sponsor migration has run — the column is simply
    // absent until then, so the homepage footer never breaks on deploy/migration timing.
    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Sponsors fetch error:', error);
      return NextResponse.json({ message: 'Destekleyenler yüklenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ sponsors: data ?? [] });
  } catch (err) {
    console.error('Sponsors GET error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
