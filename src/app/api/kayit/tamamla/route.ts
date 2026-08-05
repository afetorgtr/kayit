import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyEditToken } from '@/lib/editToken';

// T.C. Kimlik No validation (same algorithm used at registration).
function validateTCNo(tc: string): boolean {
  if (tc.length !== 11) return false;
  if (!/^\d+$/.test(tc)) return false;
  if (tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  const expectedTenth = tenth < 0 ? tenth + 10 : tenth;
  if (expectedTenth !== digits[9]) return false;
  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (totalSum % 10 !== digits[10]) return false;
  return true;
}

// GET: load the registrant's editable fields for the tokenized "complete your info" page.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const token = searchParams.get('t') || '';

  if (!verifyEditToken(id, token)) {
    return NextResponse.json({ message: 'Geçersiz veya süresi dolmuş bağlantı.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('registrants')
    .select('id, name_surname, email, phone, tc_no, birth_date, profession, position, company')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: 'Kayıt bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json({ registrant: data });
}

// POST: update the registrant's own record (token-gated). Email is not editable.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, t } = body;

    if (!verifyEditToken(id, t)) {
      return NextResponse.json({ message: 'Geçersiz veya süresi dolmuş bağlantı.' }, { status: 401 });
    }

    const editable = ['name_surname', 'phone', 'tc_no', 'birth_date', 'profession', 'position', 'company'];
    const updates: Record<string, string | null> = {};
    for (const key of editable) {
      if (key in body) {
        const raw = typeof body[key] === 'string' ? body[key].trim() : body[key];
        updates[key] = raw === '' || raw == null ? null : raw;
      }
    }

    if ('name_surname' in updates && !updates.name_surname) {
      return NextResponse.json({ message: 'Ad Soyad boş bırakılamaz.' }, { status: 400 });
    }
    if ('phone' in updates && !updates.phone) {
      return NextResponse.json({ message: 'Telefon boş bırakılamaz.' }, { status: 400 });
    }
    if (updates.tc_no && !validateTCNo(updates.tc_no)) {
      return NextResponse.json({ message: 'Geçersiz T.C. Kimlik Numarası.' }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Güncellenecek bir alan yok.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('registrants').update(updates).eq('id', id);
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Bu T.C. Kimlik Numarası ile başka bir kayıt bulunuyor.' },
          { status: 400 }
        );
      }
      console.error('Edit update error:', error);
      return NextResponse.json({ message: 'Bilgiler güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bilgileriniz başarıyla güncellendi. Teşekkür ederiz.' });
  } catch (err) {
    console.error('Edit POST error:', err);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}
