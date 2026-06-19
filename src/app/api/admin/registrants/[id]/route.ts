import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { isValidRole } from '@/lib/roles';

// Next 16: dynamic route params are a Promise and must be awaited.
type Ctx = { params: Promise<{ id: string }> };

// Update a registrant's badge role.
export async function PATCH(request: Request, ctx: Ctx) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const { role } = await request.json();

    if (!isValidRole(role)) {
      return NextResponse.json({ message: 'Geçersiz rol.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('registrants')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Registrant role update error:', error);
      return NextResponse.json({ message: 'Rol güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ registrant: data });
  } catch (err) {
    console.error('Registrant PATCH error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}

// Delete a registrant.
export async function DELETE(request: Request, ctx: Ctx) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const { error } = await supabaseAdmin.from('registrants').delete().eq('id', id);

    if (error) {
      console.error('Registrant delete error:', error);
      return NextResponse.json({ message: 'Kayıt silinemedi.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Kayıt silindi.' });
  } catch (err) {
    console.error('Registrant DELETE error:', err);
    return NextResponse.json({ message: 'Sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
