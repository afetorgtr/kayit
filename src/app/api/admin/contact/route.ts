import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/adminAuth';

// Admin endpoint: lists all contact messages, newest first.
export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Contact list error:', error);
    return NextResponse.json({ message: 'Mesajlar yüklenemedi.' }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] });
}
