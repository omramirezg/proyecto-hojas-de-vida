import { z } from 'zod';

/**
 * Validación de variables de entorno (server-side).
 *
 * `checkEnv()` no lanza: devuelve un reporte por grupo para diagnósticos
 * (lo usa /api/health). `assertCriticalEnv()` sí lanza si falta lo imprescindible
 * para que la app arranque (DB + Clerk), útil en scripts de despliegue.
 *
 * Nunca expongas valores: solo booleanos de "configurado / no configurado".
 */

const criticalSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
});

export interface EnvReport {
  database: boolean;
  auth: boolean;
  authWebhook: boolean;
  storage: boolean;
  ai: boolean;
  missingCritical: string[];
}

type EnvLike = Record<string, string | undefined>;

export function checkEnv(env: EnvLike = process.env): EnvReport {
  const critical = criticalSchema.safeParse(env);
  const missingCritical = critical.success
    ? []
    : critical.error.issues.map((i) => String(i.path[0]));

  return {
    database: Boolean(env.DATABASE_URL && env.DIRECT_URL),
    auth: Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY),
    authWebhook: Boolean(env.CLERK_WEBHOOK_SECRET),
    storage: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
    ai: Boolean(env.OPENAI_API_KEY),
    missingCritical,
  };
}

export function assertCriticalEnv(env: EnvLike = process.env): void {
  const report = checkEnv(env);
  if (report.missingCritical.length > 0) {
    throw new Error(
      `Faltan variables de entorno críticas: ${report.missingCritical.join(', ')}`,
    );
  }
}
