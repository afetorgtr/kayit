import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminPassword = process.env.ADMIN_PASSWORD || 'afetadmin2026';

    if (!authHeader || authHeader !== adminPassword) {
      return NextResponse.json({ message: 'Yetkisiz erişim. Geçersiz şifre.' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Lütfen en az bir ID belirtin.' }, { status: 400 });
    }

    // Fetch details for the requested IDs from Supabase
    const { data, error } = await supabaseAdmin
      .from('registrants')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Supabase batch fetch error:', error);
      return NextResponse.json({ message: 'Katılımcı bilgileri çekilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ registrants: data });
  } catch (err: any) {
    console.error('Admin registrants batch POST error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
