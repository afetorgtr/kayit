import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/adminAuth';

// Toggle the read/unread flag of a single message.
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const updates: { is_read?: boolean } = {};
    if (typeof body.is_read === 'boolean') updates.is_read = body.is_read;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Güncellenecek bir alan yok.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('contact_messages').update(updates).eq('id', id);
    if (error) {
      console.error('Contact update error:', error);
      return NextResponse.json({ message: 'Mesaj güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Mesaj güncellendi.' });
  } catch (err) {
    console.error('Contact PATCH error:', err);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Delete a single message.
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('contact_messages').delete().eq('id', id);
  if (error) {
    console.error('Contact delete error:', error);
    return NextResponse.json({ message: 'Mesaj silinemedi.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Mesaj silindi.' });
}
