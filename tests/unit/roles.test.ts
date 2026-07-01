import { describe, it, expect } from 'vitest';
import { hasPermission, roleAtLeast } from '@/lib/roles';

describe('roles y permisos', () => {
  it('COMPANY_ADMIN puede gestionar la empresa e invitar miembros', () => {
    expect(hasPermission('COMPANY_ADMIN', 'company:manage')).toBe(true);
    expect(hasPermission('COMPANY_ADMIN', 'member:invite')).toBe(true);
  });

  it('RECRUITER NO puede gestionar la empresa', () => {
    expect(hasPermission('RECRUITER', 'company:manage')).toBe(false);
  });

  it('RECRUITER puede revelar identidad de candidatos (reclutamiento ciego)', () => {
    expect(hasPermission('RECRUITER', 'candidate:reveal')).toBe(true);
  });

  it('EVALUATOR sólo califica evaluaciones y ve el dashboard', () => {
    expect(hasPermission('EVALUATOR', 'evaluation:grade')).toBe(true);
    expect(hasPermission('EVALUATOR', 'candidate:manage')).toBe(false);
  });

  it('CANDIDATE no tiene permisos de gestión', () => {
    expect(hasPermission('CANDIDATE', 'dashboard:view')).toBe(false);
    expect(hasPermission('CANDIDATE', 'job:manage')).toBe(false);
  });

  it('la jerarquía de roles respeta el mínimo privilegio', () => {
    expect(roleAtLeast('COMPANY_ADMIN', 'RECRUITER')).toBe(true);
    expect(roleAtLeast('EVALUATOR', 'RECRUITER')).toBe(false);
    expect(roleAtLeast('RECRUITER', 'RECRUITER')).toBe(true);
  });
});
