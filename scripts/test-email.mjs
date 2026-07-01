import { readFileSync } from 'node:fs';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}
const env = loadEnv('.env.local');

const to = process.argv[2] || 'omramirezg@unal.edu.co';
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: env.EMAIL_FROM || 'Talento 360 <onboarding@resend.dev>',
    to: [to],
    subject: 'Prueba de correo — Talento 360',
    html: '<p>¡Funciona! Este es un correo de prueba enviado desde <strong>Talento 360</strong> vía Resend.</p>',
  }),
});
if (res.ok) {
  const data = await res.json();
  console.log('OK: correo enviado a', to, '· id:', data.id);
} else {
  console.error('ERROR:', res.status, await res.text());
  process.exitCode = 1;
}
