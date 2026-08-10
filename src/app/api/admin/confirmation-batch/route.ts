import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { renderConfirmationEmail } from '@/lib/emails';

export const maxDuration = 60;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Backfill the "Kaydınız Alınmıştır" e-mail to registrants who signed up before the
// confirmation e-mail went live (domain verified 2026-08-05). State (already-sent ids)
// is kept in Storage so re-running never double-sends.
const BUCKET = 'reminder-state';
const KEY = 'confirmation-backfill.json';
const DEFAULT_CUTOFF = '2026-08-05'; // registered before this → never got a confirmation

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  if (error && !/exist/i.test(error.message || '')) console.warn('bucket:', error.message);
}
async function readSent(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(KEY);
  if (error || !data) return new Set();
  try {
    const arr = JSON.parse(await data.text());
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}
async function writeSent(ids: string[]) {
  const body = Buffer.from(JSON.stringify(Array.from(new Set(ids))));
  await supabaseAdmin.storage.from(BUCKET).upload(KEY, body, { upsert: true, contentType: 'application/json' });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz.' }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ message: 'Resend yapılandırılmamış.' }, { status: 500 });
  }

  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';
  const cutoff = url.searchParams.get('before') || DEFAULT_CUTOFF;

  await ensureBucket();
  const sent = await readSent();

  const { data, error } = await supabaseAdmin
    .from('registrants')
    .select('id, name_surname, email, created_at')
    .lt('created_at', cutoff);
  if (error) {
    return NextResponse.json({ message: 'Kayıtlar okunamadı.', error: error.message }, { status: 500 });
  }

  const targets = (data || []).filter((r) => !sent.has(r.id as string));

  if (dry) {
    return NextResponse.json({
      dryRun: true,
      cutoff,
      count: targets.length,
      sample: targets.slice(0, 5).map((r) => r.email),
    });
  }

  const payload = targets.map((r) => ({
    from: 'Afetlerde Büyük Veri Yönetimi Sempozyumu <onay@afet.org.tr>',
    to: [r.email as string],
    subject: 'Kaydınız Alınmıştır — Afetlerde Büyük Veri Yönetimi Sempozyumu',
    html: renderConfirmationEmail(r.name_surname as string),
  }));

  let sentCount = 0;
  try {
    for (const c of chunk(payload, 100)) {
      if (c.length === 0) continue;
      await resend.batch.send(c);
      sentCount += c.length;
    }
  } catch (err) {
    console.error('Confirmation backfill error:', err);
    return NextResponse.json({ message: 'Gönderimde hata.', sent: sentCount }, { status: 500 });
  }

  await writeSent([...sent, ...targets.map((r) => r.id as string)]);

  return NextResponse.json({ sent: sentCount, cutoff });
}
