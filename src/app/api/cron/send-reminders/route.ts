import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { renderIncompleteEmail, getMissingFieldLabels } from '@/lib/emails';
import { makeEditToken } from '@/lib/editToken';

export const maxDuration = 60;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// "Sent once" state is kept in a private Storage object instead of a DB column, so no
// schema migration (dashboard access) is needed — the service_role client manages it.
const STATE_BUCKET = 'reminder-state';
const STATE_KEY = 'sent.json';

function authorized(request: Request): boolean {
  const auth = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD || 'afetadmin2026';
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (auth === adminPassword || auth === `Bearer ${adminPassword}`) return true;
  return false;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.createBucket(STATE_BUCKET, { public: false });
  // Ignore "already exists"; anything else is non-fatal (upload will surface real issues).
  if (error && !/exist/i.test(error.message || '')) {
    console.warn('reminder-state bucket create:', error.message);
  }
}

async function readSentIds(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.storage.from(STATE_BUCKET).download(STATE_KEY);
  if (error || !data) return new Set();
  try {
    const arr = JSON.parse(await data.text());
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

async function writeSentIds(ids: string[]): Promise<void> {
  const body = Buffer.from(JSON.stringify(Array.from(new Set(ids))));
  const { error } = await supabaseAdmin.storage
    .from(STATE_BUCKET)
    .upload(STATE_KEY, body, { upsert: true, contentType: 'application/json' });
  if (error) console.error('reminder-state write:', error.message);
}

// Daily reminder: e-mail participants whose optional info is still missing, exactly once,
// starting 1 day after they registered. Existing (older) incomplete records are caught on
// the first run; new ones become eligible a day after registering.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz.' }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ message: 'Resend yapılandırılmamış.' }, { status: 500 });
  }

  const base = 'https://kayit.vercel.app'; // canonical domain (do not trust NEXT_PUBLIC_APP_URL)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // registered ≥ 1 day ago

  await ensureBucket();
  const sent = await readSentIds();

  const { data, error } = await supabaseAdmin
    .from('registrants')
    .select('id, name_surname, email, phone, tc_no, birth_date, profession, position, company, created_at')
    .lte('created_at', cutoff);

  if (error) {
    console.error('Reminder query error:', error);
    return NextResponse.json({ message: 'Kayıtlar okunamadı.', error: error.message }, { status: 500 });
  }

  // Only registrants not already processed by a previous run.
  const rows = (data || []).filter((r) => !sent.has(r.id as string));
  const needsEmail = rows
    .map((r) => ({ r, missing: getMissingFieldLabels(r) }))
    .filter((x) => x.missing.length > 0);

  const dry = new URL(request.url).searchParams.get('dry') === '1';
  if (dry) {
    return NextResponse.json({
      dryRun: true,
      eligible: rows.length,
      wouldEmail: needsEmail.length,
      alreadyComplete: rows.length - needsEmail.length,
      recipients: needsEmail.map((x) => ({ email: x.r.email, missing: x.missing })),
    });
  }

  const payload = needsEmail.map(({ r, missing }) => ({
    from: 'Afetlerde Büyük Veri Yönetimi Sempozyumu <onay@afet.org.tr>',
    to: [r.email as string],
    subject: 'Kaydınızda Eksik Bilgiler Var — Afetlerde Büyük Veri Yönetimi Sempozyumu',
    html: renderIncompleteEmail(
      r.name_surname as string,
      missing,
      `${base}/kayit/tamamla?id=${r.id}&t=${makeEditToken(r.id as string)}`
    ),
  }));

  let reminded = 0;
  try {
    for (const c of chunk(payload, 100)) {
      if (c.length === 0) continue;
      await resend.batch.send(c);
      reminded += c.length;
    }
  } catch (err) {
    console.error('Reminder batch send error:', err);
    return NextResponse.json({ message: 'E-posta gönderiminde hata.', reminded }, { status: 500 });
  }

  // Mark every processed row (emailed or already complete) so each is handled only once.
  if (rows.length > 0) {
    await writeSentIds([...sent, ...rows.map((r) => r.id as string)]);
  }

  return NextResponse.json({
    processed: rows.length,
    reminded,
    already_complete: rows.length - needsEmail.length,
  });
}
