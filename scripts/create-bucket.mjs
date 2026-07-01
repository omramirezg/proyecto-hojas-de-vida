// Script de un solo uso: crea el bucket privado de CVs en Supabase Storage.
// Lee las credenciales de .env.local. Ejecutar: node scripts/create-bucket.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const env = loadEnv('.env.local');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = env.SUPABASE_STORAGE_BUCKET || 'resumes';

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.storage.createBucket(bucket, {
  public: false,
  fileSizeLimit: 10 * 1024 * 1024,
});

if (error) {
  if (String(error.message).toLowerCase().includes('already exists')) {
    console.log(`OK: el bucket "${bucket}" ya existe (privado).`);
  } else {
    console.error('Error creando el bucket:', error.message);
    process.exit(1);
  }
} else {
  console.log(`OK: bucket "${bucket}" creado (privado).`, data);
}
