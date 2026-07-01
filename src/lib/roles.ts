import type { CompanyRole } from '@prisma/client';

/**
 * Definición central de permisos por rol (principio de mínimo privilegio).
 * Mantener TODA la lógica de autorización aquí evita reglas dispersas e inconsistentes.
 */

export const ROLE_LABELS: Record<CompanyRole | 'SUPERADMIN', string> = {
  COMPANY_ADMIN: 'Admin de empresa',
  RECRUITER: 'Reclutador',
  EVALUATOR: 'Evaluador',
  CANDIDATE: 'Candidato',
  SUPERADMIN: 'Superadmin',
};

/** Jerarquía: un valor mayor implica más privilegios dentro de la empresa. */
export const ROLE_RANK: Record<CompanyRole, number> = {
  COMPANY_ADMIN: 40,
  RECRUITER: 30,
  EVALUATOR: 20,
  CANDIDATE: 10,
};

export type Permission =
  | 'company:manage' // editar empresa, configuración
  | 'member:invite' // invitar / gestionar miembros
  | 'job:manage' // crear / editar vacantes (fases futuras)
  | 'candidate:manage' // gestionar candidatos (fases futuras)
  | 'candidate:reveal' // revelar identidad en reclutamiento ciego (fases futuras)
  | 'evaluation:grade' // calificar evaluaciones (fases futuras)
  | 'dashboard:view';

const PERMISSIONS_BY_ROLE: Record<CompanyRole, Permission[]> = {
  COMPANY_ADMIN: [
    'company:manage',
    'member:invite',
    'job:manage',
    'candidate:manage',
    'candidate:reveal',
    'evaluation:grade',
    'dashboard:view',
  ],
  RECRUITER: ['job:manage', 'candidate:manage', 'candidate:reveal', 'dashboard:view'],
  EVALUATOR: ['evaluation:grade', 'dashboard:view'],
  CANDIDATE: [],
};

export function hasPermission(role: CompanyRole, permission: Permission): boolean {
  return PERMISSIONS_BY_ROLE[role].includes(permission);
}

export function roleAtLeast(role: CompanyRole, minimum: CompanyRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
