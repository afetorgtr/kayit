import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { isAdminAuthorized } from '@/lib/adminAuth';
import {
  renderIncompleteEmail,
  getMissingFieldLabels,
  getMissingFieldKeys,
  OPTIONAL_FIELDS,
} from '@/lib/emails';
import { makeEditToken } from '@/lib/editToken';

export const maxDuration = 60;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// One "Kurum/Görev/Meslek" completion campaign; state kept in Storage (no DB migration).
const BUCKET = 'reminder-state';
const KEY = 'campaign.json';

interface Recipient {
  id: string;
  email: string;
  name: string;
  missing: string[]; // field keys that were empty at send time
}
interface Campaign {
  sentAt: string;
  recipients: Recipient[];
}

const LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  OPTIONAL_FIELDS.map((f) => [f.key, f.label])
);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  if (error && !/exist/i.test(error.message || '')) console.warn('bucket:', error.message);
}
async function readCampaign(): Promise<Campaign | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(KEY);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}
async function writeCampaign(c: Campaign) {
  const body = Buffer.from(JSON.stringify(c));
  await supabaseAdmin.storage
    .from(BUCKET)
    .upload(KEY, body, { upsert: true, contentType: 'application/json' });
}

// POST: send the campaign (or preview with ?dry=1). Refuses to re-send unless ?force=1.
export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz.' }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ message: 'Resend yapılandırılmamış.' }, { status: 500 });
  }

  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';
  const force = url.searchParams.get('force') === '1';
  // Hardcoded canonical domain — never trust NEXT_PUBLIC_APP_URL (it was mis-set to a
  // different project's domain, which broke the "Bilgilerimi Tamamla" links).
  const base = 'https://kayit.vercel.app';

  const { data, error } = await supabaseAdmin
    .from('registrants')
    .select('id, name_surname, email, company, position, profession');
  if (error) {
    return NextResponse.json({ message: 'Kayıtlar okunamadı.', error: error.message }, { status: 500 });
  }

  const targets = (data || [])
    .map((r) => ({ r, keys: getMissingFieldKeys(r), labels: getMissingFieldLabels(r) }))
    .filter((x) => x.keys.length > 0);

  if (dry) {
    return NextResponse.json({
      dryRun: true,
      count: targets.length,
      recipients: targets.map((x) => ({ email: x.r.email, missing: x.labels })),
    });
  }

  await ensureBucket();
  const existing = await readCampaign();
  if (existing && !force) {
    return NextResponse.json(
      { message: 'Kampanya zaten gönderilmiş. Tekrar göndermek için force gerekir.', alreadySent: true, sentAt: existing.sentAt },
      { status: 409 }
    );
  }

  const payload = targets.map((x) => ({
    from: 'Afetlerde Büyük Veri Yönetimi Sempozyumu <onay@afet.org.tr>',
    to: [x.r.email as string],
    subject: 'Kurum ve Görev Bilgilerinizi Tamamlar mısınız? — Afetlerde Büyük Veri Yönetimi Sempozyumu',
    html: renderIncompleteEmail(
      x.r.name_surname as string,
      x.labels,
      `${base}/kayit/tamamla?id=${x.r.id}&t=${makeEditToken(x.r.id as string)}`
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
    console.error('Campaign send error:', err);
    return NextResponse.json({ message: 'Gönderimde hata.', sent }, { status: 500 });
  }

  const campaign: Campaign = {
    sentAt: new Date().toISOString(),
    recipients: targets.map((x) => ({
      id: x.r.id as string,
      email: x.r.email as string,
      name: x.r.name_surname as string,
      missing: x.keys,
    })),
  };
  await writeCampaign(campaign);

  return NextResponse.json({ sent, total: targets.length });
}

// GET: dashboard stats — how many were e-mailed and how many have since completed.
export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: 'Yetkisiz.' }, { status: 401 });
  }

  const campaign = await readCampaign();
  if (!campaign) {
    return NextResponse.json({ exists: false, sent: 0, completed: 0, pending: 0 });
  }

  const ids = campaign.recipients.map((r) => r.id);
  const { data } = await supabaseAdmin
    .from('registrants')
    .select('id, company, position, profession')
    .in('id', ids);
  const current = new Map((data || []).map((r) => [r.id, r]));

  const isEmpty = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

  let completed = 0;
  const rows = campaign.recipients.map((rec) => {
    const cur = current.get(rec.id) as Record<string, unknown> | undefined;
    // Completed if every field that was missing at send time is now filled.
    const remaining = cur
      ? rec.missing.filter((k) => isEmpty(cur[k]))
      : rec.missing;
    const done = remaining.length === 0;
    if (done) completed += 1;
    return {
      name: rec.name,
      email: rec.email,
      wasMissing: rec.missing.map((k) => LABEL_BY_KEY[k] || k),
      remaining: remaining.map((k) => LABEL_BY_KEY[k] || k),
      done,
    };
  });

  const sent = campaign.recipients.length;
  return NextResponse.json({
    exists: true,
    sentAt: campaign.sentAt,
    sent,
    completed,
    pending: sent - completed,
    completionRate: sent ? Math.round((completed / sent) * 100) : 0,
    recipients: rows,
  });
}
