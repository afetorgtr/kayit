import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'afetadmin2026';

    if (!authHeader || authHeader !== adminPassword) {
      return NextResponse.json({ message: 'Yetkisiz erişim. Geçersiz şifre.' }, { status: 401 });
    }

    // Fetch all registrants from Supabase sorted by created_at descending
    const { data, error } = await supabaseAdmin
      .from('registrants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ message: 'Veritabanından kayıtlar çekilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ registrants: data });
  } catch (err: any) {
    console.error('Admin registrants GET error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
