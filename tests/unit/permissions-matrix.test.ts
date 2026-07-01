import { describe, it, expect } from 'vitest';
import { hasPermission, type Permission } from '@/lib/roles';
import type { CompanyRole } from '@prisma/client';

/**
 * Matriz de permisos: documenta y bloquea regresiones en el control de acceso.
 * Si cambias PERMISSIONS_BY_ROLE, esta tabla debe actualizarse conscientemente.
 */
const MATRIX: Record<CompanyRole, Record<Permission, boolean>> = {
  COMPANY_ADMIN: {
    'company:manage': true,
    'member:invite': true,
    'job:manage': true,
    'candidate:manage': true,
    'candidate:reveal': true,
    'evaluation:grade': true,
    'dashboard:view': true,
  },
  RECRUITER: {
    'company:manage': false,
    'member:invite': false,
    'job:manage': true,
    'candidate:manage': true,
    'candidate:reveal': true,
    'evaluation:grade': false,
    'dashboard:view': true,
  },
  EVALUATOR: {
    'company:manage': false,
    'member:invite': false,
    'job:manage': false,
    'candidate:manage': false,
    'candidate:reveal': false,
    'evaluation:grade': true,
    'dashboard:view': true,
  },
  CANDIDATE: {
    'company:manage': false,
    'member:invite': false,
    'job:manage': false,
    'candidate:manage': false,
    'candidate:reveal': false,
    'evaluation:grade': false,
    'dashboard:view': false,
  },
};

describe('matriz de permisos por rol', () => {
  for (const role of Object.keys(MATRIX) as CompanyRole[]) {
    for (const permission of Object.keys(MATRIX[role]) as Permission[]) {
      const expected = MATRIX[role][permission];
      it(`${role} ${expected ? 'TIENE' : 'NO tiene'} ${permission}`, () => {
        expect(hasPermission(role, permission)).toBe(expected);
      });
    }
  }

  it('ningún rol salvo admin puede gestionar la empresa', () => {
    expect(hasPermission('RECRUITER', 'company:manage')).toBe(false);
    expect(hasPermission('EVALUATOR', 'company:manage')).toBe(false);
    expect(hasPermission('CANDIDATE', 'company:manage')).toBe(false);
  });

  it('solo admin y evaluador pueden calificar', () => {
    expect(hasPermission('COMPANY_ADMIN', 'evaluation:grade')).toBe(true);
    expect(hasPermission('EVALUATOR', 'evaluation:grade')).toBe(true);
    expect(hasPermission('RECRUITER', 'evaluation:grade')).toBe(false);
  });
});
