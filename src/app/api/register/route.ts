import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

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
          from: 'Sempozyum Kayıt <onay@afet.org.tr>', // Note: Must verify domain on Resend. If not verified, fallback to testing email
          to: email,
          subject: 'Afetlerde Büyük Veri Yönetimi Sempozyumu Kayıt Onayı',
          html: `
            <div style="font-family: sans-serif; background-color: #030908; color: #f4f4f5; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #064e3b;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 10px 20px; background-color: #064e3b; border-radius: 8px; color: #8be92c; font-weight: bold; font-size: 20px; letter-spacing: 1px;">
                  AAD
                </div>
                <h2 style="color: #ffffff; margin-top: 15px; margin-bottom: 5px;">Afet Araştırmaları Derneği</h2>
                <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Sempozyum Düzenleme Kurulu</p>
              </div>
              
              <div style="background-color: #18181b; padding: 25px; border-radius: 12px; border: 1px solid #27272a;">
                <h3 style="color: #8be92c; margin-top: 0; margin-bottom: 15px;">Kayıt Onay Mesajı</h3>
                <p style="font-size: 16px; line-height: 1.6; color: #e4e4e7;">Sayın <strong>${name_surname}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
                  15-16 Ağustos 2026 tarihlerinde Ankara Ticaret Odası Meclis Salonu'nda gerçekleştirilecek <strong>“Afetlerde Büyük Veri Yönetimi Sempozyumu”</strong> için kaydınız başarıyla tamamlanmıştır.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;">
                
                <h4 style="color: #ffffff; margin-top: 0; margin-bottom: 10px;">Etkinlik Detayları:</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4d4d8;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa; width: 100px;">Tarih:</td>
                    <td style="padding: 6px 0;">15-16 Ağustos 2026</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Yer:</td>
                    <td style="padding: 6px 0;">Ankara Ticaret Odası (ATO) Meclis Salonu, Ankara</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #a1a1aa;">Kayıt ID:</td>
                    <td style="padding: 6px 0; font-family: monospace; color: #8be92c;">${data.id}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #71717a; line-height: 1.6;">
                <p>Ulaşım ve mekan bilgileri için <a href="${appUrl}" style="color: #8be92c; text-decoration: none;">etkinlik web sayfasını</a> ziyaret edebilirsiniz.</p>
                <p>Sorularınız için: <a href="mailto:bilgi@afet.org.tr" style="color: #8be92c; text-decoration: none;">bilgi@afet.org.tr</a></p>
                <p style="margin-top: 20px; font-size: 10px; color: #52525b;">Bu etkinlik T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler Genel Müdürlüğü tarafından desteklenmektedir.</p>
              </div>
            </div>
          `
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
