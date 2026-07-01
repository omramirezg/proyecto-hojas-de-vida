import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * Servicio de auditoría. Registra acciones sensibles desde el día 1.
 * Nunca debe lanzar y romper el flujo principal: si falla el log, se traga el error
 * (pero se reporta a stderr) para no bloquear la operación de negocio.
 */

export interface AuditEntry {
  action: string;
  actorId?: string | null;
  companyId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId ?? null,
        companyId: entry.companyId ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[audit] no se pudo registrar la acción', entry.action, error);
  }
}
