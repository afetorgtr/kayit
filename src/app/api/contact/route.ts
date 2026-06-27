import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isValidSubject, DEFAULT_CONTACT_SUBJECT } from '@/lib/contactSubjects';

// Public endpoint: stores a visitor contact message for the admin panel to triage.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, phone, subject, message } = body;

    // Required: name, surname, phone and message. Subject falls back to a default.
    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: 'Lütfen isim, soyisim, telefon ve mesaj alanlarını doldurun.' },
        { status: 400 }
      );
    }

    // Only accept one of the known subjects; anything else collapses to the default
    // so the admin view never has to deal with arbitrary free-text categories.
    const safeSubject = isValidSubject(subject) ? subject : DEFAULT_CONTACT_SUBJECT;

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert([
        {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: phone.trim(),
          subject: safeSubject,
          message: message.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Contact insert error:', error);
      return NextResponse.json({ message: 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Mesajınız alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.', data },
      { status: 201 }
    );
  } catch (err) {
    console.error('API contact error:', err);
    return NextResponse.json({ message: 'Mesaj gönderilirken bir hata oluştu.' }, { status: 500 });
  }
}
