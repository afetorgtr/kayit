import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { uploadSponsorLogo, deleteSponsorLogo } from '@/lib/sponsorStorage';

// Next 16: dynamic route params are a Promise and must be awaited.
type Ctx = { params: Promise<{ id: string }> };

// Update a sponsor's name and/or replace its logo (multipart/form-data).
export async function PATCH(request: Request, ctx: Ctx) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const formData = await request.formData();
    const name = (formData.get('name') as string | null)?.trim();
    const logo = formData.get('logo') as File | null;
    const sortOrderRaw = formData.get('sort_order') as string | null;
    const badgeSponsorRaw = formData.get('is_badge_sponsor') as string | null;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('sponsors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ message: 'Destekleyen bulunamadı.' }, { status: 404 });
    }

    const updates: {
      name?: string;
      logo_url?: string;
      sort_order?: number;
      is_badge_sponsor?: boolean;
    } = {};
    if (name) updates.name = name;
    if (sortOrderRaw !== null && sortOrderRaw !== '') {
      updates.sort_order = parseInt(sortOrderRaw, 10) || 0;
    }

    // Single badge sponsor: when enabling this one, clear the flag on every other sponsor
    // first so at most one logo ever appears on the printed lanyard.
    if (badgeSponsorRaw !== null) {
      const enable = badgeSponsorRaw === 'true';
      updates.is_badge_sponsor = enable;
      if (enable) {
        const { error: clearErr } = await supabaseAdmin
          .from('sponsors')
          .update({ is_badge_sponsor: false })
          .neq('id', id)
          .eq('is_badge_sponsor', true);
        if (clearErr) {
          console.error('Badge sponsor clear error:', clearErr);
          return NextResponse.json({ message: 'Yaka kartı sponsoru güncellenemedi.' }, { status: 500 });
        }
      }
    }

    if (logo && logo.size > 0) {
      const uploadRes = await uploadSponsorLogo(logo);
      if ('error' in uploadRes) {
        return NextResponse.json({ message: uploadRes.error }, { status: 400 });
      }
      updates.logo_url = uploadRes.url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Güncellenecek veri yok.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Sponsor update error:', error);
      return NextResponse.json({ message: 'Güncelleme başarısız oldu.' }, { status: 500 });
    }

    // Clean up the previous logo only after the row was successfully repointed.
    if (updates.logo_url && existing.logo_url) {
      await deleteSponsorLogo(existing.logo_url);
    }

    return NextResponse.json({ sponsor: data });
  } catch (err) {
    console.error('Sponsor PATCH error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}

// Delete a sponsor and its logo object.
export async function DELETE(request: Request, ctx: Ctx) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;

    const { data: existing } = await supabaseAdmin
      .from('sponsors')
      .select('logo_url')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin.from('sponsors').delete().eq('id', id);

    if (error) {
      console.error('Sponsor delete error:', error);
      return NextResponse.json({ message: 'Silme başarısız oldu.' }, { status: 500 });
    }

    if (existing?.logo_url) {
      await deleteSponsorLogo(existing.logo_url);
    }

    return NextResponse.json({ message: 'Destekleyen silindi.' });
  } catch (err) {
    console.error('Sponsor DELETE error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
