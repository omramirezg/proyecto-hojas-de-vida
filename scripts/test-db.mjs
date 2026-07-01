import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}
const env = loadEnv('.env');
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.DIRECT_URL = env.DIRECT_URL;

const db = new PrismaClient();
try {
  const n = await db.company.count();
  console.log('OK: conexión a la base de datos (pooled 6543). Empresas:', n);
} catch (e) {
  console.error('ERROR pooled code:', e.code);
  console.error('ERROR pooled msg:', e.message);
} finally {
  await db.$disconnect();
}
