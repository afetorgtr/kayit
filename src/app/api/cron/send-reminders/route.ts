import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { renderIncompleteEmail, getMissingFieldLabels } from '@/lib/emails';
import { makeEditToken } from '@/lib/editToken';

// Allow a little more time for the batch send on Vercel.
export const maxDuration = 60;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Authorized either by Vercel Cron (Bearer CRON_SECRET) or a manual admin trigger.
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

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://kayit.vercel.app';
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // registered ≥ 1 day ago

  const { data, error } = await supabaseAdmin
    .from('registrants')
    .select('id, name_surname, email, phone, tc_no, birth_date, profession, position, company, created_at')
    .is('reminder_sent_at', null)
    .lte('created_at', cutoff);

  if (error) {
    console.error('Reminder query error:', error);
    return NextResponse.json({ message: 'Kayıtlar okunamadı.', error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const needsEmail = rows
    .map((r) => ({ r, missing: getMissingFieldLabels(r) }))
    .filter((x) => x.missing.length > 0);

  // Preview mode: report who would be e-mailed without sending or marking anything.
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

  let sent = 0;
  try {
    for (const c of chunk(payload, 100)) {
      if (c.length === 0) continue;
      await resend.batch.send(c);
      sent += c.length;
    }
  } catch (err) {
    console.error('Reminder batch send error:', err);
    return NextResponse.json({ message: 'E-posta gönderiminde hata.', sent }, { status: 500 });
  }

  // Mark every processed row (emailed or already complete) so each is handled only once.
  const processedIds = rows.map((r) => r.id);
  if (processedIds.length > 0) {
    const { error: markErr } = await supabaseAdmin
      .from('registrants')
      .update({ reminder_sent_at: new Date().toISOString() })
      .in('id', processedIds);
    if (markErr) console.error('Reminder mark error:', markErr);
  }

  return NextResponse.json({
    processed: rows.length,
    reminded: sent,
    already_complete: rows.length - needsEmail.length,
  });
}
