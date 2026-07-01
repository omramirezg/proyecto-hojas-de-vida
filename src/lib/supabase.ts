import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con SERVICE ROLE — SOLO para uso en el servidor.
 * Bypassa RLS, por lo que la autorización se hace ANTES en la capa de aplicación
 * (guards + filtrado por companyId). Nunca importar esto en código de cliente.
 */

export const RESUME_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'resumes';

let cached: SupabaseClient | null = null;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('STORAGE_NOT_CONFIGURED');
    this.name = 'StorageNotConfiguredError';
  }
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageNotConfiguredError();
  if (!cached) {
    cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cached;
}
