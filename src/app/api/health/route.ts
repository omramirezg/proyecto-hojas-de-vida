import { checkEnv } from '@/lib/env';

/**
 * Endpoint de salud para monitoreo/uptime. Público (sin datos sensibles):
 * solo reporta qué grupos de configuración están presentes, nunca los valores.
 */
export async function GET() {
  const env = checkEnv();
  const healthy = env.database && env.auth;

  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        database: env.database,
        auth: env.auth,
        authWebhook: env.authWebhook,
        storage: env.storage,
        ai: env.ai,
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
