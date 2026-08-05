import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { renderConfirmationEmail } from '@/lib/emails';

// T.C. Kimlik validation server-side sanity check
function validateTCNo(tc: string): boolean {
  if (tc.length !== 11) return false;
  if (!/^\d+$/.test(tc)) return false;
  if (tc[0] === '0') return false;

  const digits = tc.split('').map(Number);
  
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  const expectedTenth = tenthDigit < 0 ? tenthDigit + 10 : tenthDigit;
  if (expectedTenth !== digits[9]) return false;

  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (totalSum % 10 !== digits[10]) return false;

  return true;
}

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name_surname, birth_date, tc_no, profession, position, company, email, phone } = body;

    // Server-side validation: only name, email and phone are required
    if (!name_surname?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ message: 'Lütfen ad-soyad, e-posta ve telefon alanlarını doldurun.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Geçersiz e-posta adresi.' }, { status: 400 });
    }

    // T.C. Kimlik No is optional — validate only when provided
    if (tc_no && !validateTCNo(tc_no)) {
      return NextResponse.json({ message: 'Geçersiz T.C. Kimlik Numarası.' }, { status: 400 });
    }

    // Insert into Supabase using admin client to bypass RLS policies safely
    const { data, error } = await supabaseAdmin
      .from('registrants')
      .insert([
        {
          name_surname,
          birth_date: birth_date || null,
          tc_no: tc_no || null,
          profession: profession || null,
          position: position || null,
          company: company || null,
          email,
          phone
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation — distinguish email vs tc_no
        const isEmail = (error.message || '').toLowerCase().includes('email');
        return NextResponse.json({
          message: isEmail
            ? 'Bu e-posta adresi ile daha önce kayıt yapılmış.'
            : 'Bu T.C. Kimlik Numarası ile daha önce kayıt yapılmış.',
        }, { status: 400 });
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json({ message: 'Veritabanı kaydı başarısız oldu.' }, { status: 500 });
    }

    // Send email notification via Resend if configured
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Afetlerde Büyük Veri Yönetimi Sempozyumu <onay@afet.org.tr>',
          to: email,
          subject: 'Kaydınız Alınmıştır — Afetlerde Büyük Veri Yönetimi Sempozyumu',
          html: renderConfirmationEmail(name_surname),
        });
      } catch (emailErr) {
        // Log email error but do not fail the request since database registration succeeded
        console.error('Failed to send confirmation email:', emailErr);
      }
    } else {
      console.log('Resend not configured. Registered successfully without email sending.', data);
    }

    return NextResponse.json({ message: 'Kayıt başarıyla oluşturuldu.', data }, { status: 201 });
  } catch (err: any) {
    console.error('API register error:', err);
    return NextResponse.json({ message: 'Kayıt sırasında sistemsel bir hata oluştu.' }, { status: 500 });
  }
}
