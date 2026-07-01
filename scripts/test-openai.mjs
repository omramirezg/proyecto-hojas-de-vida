// Prueba de un solo uso: verifica que la API key de OpenAI funciona.
import { readFileSync } from 'node:fs';
import OpenAI from 'openai';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const env = loadEnv('.env.local');
const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

try {
  const r = await client.chat.completions.create({
    model: env.AI_MODEL_EXTRACTION || 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Responde solo con la palabra: OK' }],
    max_tokens: 5,
  });
  console.log('RESPUESTA:', r.choices[0]?.message?.content);
  console.log('OK: la API key de OpenAI funciona y tiene saldo.');
} catch (e) {
  console.error('ERROR:', e.status, e.message);
  process.exit(1);
}
