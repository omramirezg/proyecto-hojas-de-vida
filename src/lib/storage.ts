import { getSupabaseAdmin, RESUME_BUCKET } from '@/lib/supabase';

/** Operaciones de almacenamiento de CVs en un bucket PRIVADO de Supabase. */

export async function uploadResume(params: {
  path: string;
  data: ArrayBuffer | Buffer;
  contentType: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(params.path, params.data, {
    contentType: params.contentType,
    upsert: false,
  });
  if (error) throw new Error(`STORAGE_UPLOAD_FAILED: ${error.message}`);
}

/** Genera una URL firmada de corta duración para descargar/ver un CV privado. */
export async function getSignedResumeUrl(path: string, expiresInSeconds = 60): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(`STORAGE_SIGN_FAILED: ${error?.message ?? 'unknown'}`);
  return data.signedUrl;
}

export async function removeResume(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(RESUME_BUCKET).remove([path]);
}

/** Descarga un CV del bucket privado como Buffer (uso server-side: extracción). */
export async function downloadResume(path: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);
  if (error || !data) throw new Error(`STORAGE_DOWNLOAD_FAILED: ${error?.message ?? 'unknown'}`);
  return Buffer.from(await data.arrayBuffer());
}
