import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { uploadSponsorLogo } from '@/lib/sponsorStorage';

// List all sponsors (including logo-less ones) for the admin panel.
export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim. Geçersiz şifre.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('sponsors')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Admin sponsors fetch error:', error);
    return NextResponse.json({ message: 'Destekleyenler çekilemedi.' }, { status: 500 });
  }

  return NextResponse.json({ sponsors: data ?? [] });
}

// Create a sponsor. Accepts multipart/form-data: name (required), logo (optional), sort_order (optional).
export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = (formData.get('name') as string | null)?.trim();
    const logo = formData.get('logo') as File | null;
    const sortOrderRaw = formData.get('sort_order') as string | null;

    if (!name) {
      return NextResponse.json({ message: 'Firma adı gereklidir.' }, { status: 400 });
    }

    let logo_url: string | null = null;
    if (logo && logo.size > 0) {
      const uploadRes = await uploadSponsorLogo(logo);
      if ('error' in uploadRes) {
        return NextResponse.json({ message: uploadRes.error }, { status: 400 });
      }
      logo_url = uploadRes.url;
    }

    const sort_order = sortOrderRaw ? parseInt(sortOrderRaw, 10) || 0 : 0;

    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .insert([{ name, logo_url, sort_order }])
      .select()
      .single();

    if (error) {
      console.error('Sponsor insert error:', error);
      return NextResponse.json({ message: 'Destekleyen eklenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ sponsor: data }, { status: 201 });
  } catch (err) {
    console.error('Sponsor POST error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
