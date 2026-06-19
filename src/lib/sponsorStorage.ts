import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'sponsor-logos';
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

type UploadResult = { url: string } | { error: string };

// Validates and uploads a sponsor logo to the public Storage bucket, returning its public URL.
export async function uploadSponsorLogo(file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { error: 'Sadece PNG, JPG, SVG veya WEBP yükleyebilirsiniz.' };
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Logo en fazla 2 MB olabilir.' };
  }

  const ext = EXT_BY_MIME[file.type] ?? 'png';
  const path = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('Sponsor logo upload error:', error);
    return { error: 'Logo yüklenemedi. Lütfen tekrar deneyin.' };
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

// Extracts the storage object path from a public logo URL (for deletion).
function extractLogoPath(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  const marker = `/${BUCKET}/`;
  const idx = logoUrl.indexOf(marker);
  if (idx === -1) return null;
  return logoUrl.slice(idx + marker.length);
}

// Best-effort removal of a sponsor logo object from Storage. Never throws.
export async function deleteSponsorLogo(logoUrl: string | null): Promise<void> {
  const path = extractLogoPath(logoUrl);
  if (!path) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('Sponsor logo delete error:', error);
  }
}
