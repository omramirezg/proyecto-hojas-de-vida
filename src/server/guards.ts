import { requireSession, type MembershipWithCompany } from '@/lib/auth';
import { hasPermission, roleAtLeast, type Permission } from '@/lib/roles';
import type { CompanyRole } from '@prisma/client';

/**
 * Guards de autorización para Server Actions y Route Handlers.
 *
 * Garantizan dos cosas críticas del SaaS multi-tenant:
 *  1. El usuario pertenece a la empresa que dice (aislamiento de tenant).
 *  2. El usuario tiene el rol/permiso necesario (mínimo privilegio).
 *
 * Lanzan errores con códigos estables que la capa de UI traduce a respuestas.
 */

export class AuthorizationError extends Error {
  constructor(
    public readonly code: 'FORBIDDEN' | 'NOT_A_MEMBER' | 'UNAUTHENTICATED',
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthorizationError';
  }
}

export interface CompanyContext {
  userId: string;
  companyId: string;
  role: CompanyRole;
  membership: MembershipWithCompany;
}

/**
 * Verifica que el usuario actual sea miembro ACTIVO de `companyId`.
 * Devuelve el contexto de empresa (tenant) para usar en queries posteriores.
 */
export async function requireCompanyMembership(companyId: string): Promise<CompanyContext> {
  const { user, memberships } = await requireSession();

  const membership = memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );

  if (!membership) {
    throw new AuthorizationError('NOT_A_MEMBER', 'No perteneces a esta empresa.');
  }

  return { userId: user.id, companyId, role: membership.role, membership };
}

/** Igual que el anterior pero además exige un permiso concreto. */
export async function requirePermission(
  companyId: string,
  permission: Permission,
): Promise<CompanyContext> {
  const ctx = await requireCompanyMembership(companyId);
  if (!hasPermission(ctx.role, permission)) {
    throw new AuthorizationError('FORBIDDEN', `Permiso requerido: ${permission}.`);
  }
  return ctx;
}

/** Exige un rol mínimo en la jerarquía. */
export async function requireRole(
  companyId: string,
  minimumRole: CompanyRole,
): Promise<CompanyContext> {
  const ctx = await requireCompanyMembership(companyId);
  if (!roleAtLeast(ctx.role, minimumRole)) {
    throw new AuthorizationError('FORBIDDEN', `Rol mínimo requerido: ${minimumRole}.`);
  }
  return ctx;
}
