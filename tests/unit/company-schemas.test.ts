import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/utils';
import { companyCreateSchema, inviteMemberSchema } from '@/features/companies/schemas';

describe('slugify', () => {
  it('normaliza acentos y espacios', () => {
    expect(slugify('Mi Startup S.A.S.')).toBe('mi-startup-sas');
    expect(slugify('Café Latino')).toBe('cafe-latino');
    expect(slugify('  Doble   Espacio ')).toBe('doble-espacio');
  });
});

describe('companyCreateSchema', () => {
  it('acepta solo el nombre (resto opcional)', () => {
    const r = companyCreateSchema.safeParse({ name: 'Acme' });
    expect(r.success).toBe(true);
  });

  it('rechaza nombres demasiado cortos', () => {
    const r = companyCreateSchema.safeParse({ name: 'A' });
    expect(r.success).toBe(false);
  });

  it('rechaza websites con URL inválida', () => {
    const r = companyCreateSchema.safeParse({ name: 'Acme', website: 'no-es-url' });
    expect(r.success).toBe(false);
  });

  it('convierte strings vacíos en undefined', () => {
    const r = companyCreateSchema.safeParse({ name: 'Acme', sector: '', website: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sector).toBeUndefined();
      expect(r.data.website).toBeUndefined();
    }
  });
});

describe('inviteMemberSchema', () => {
  it('normaliza el email a minúsculas', () => {
    const r = inviteMemberSchema.safeParse({
      companyId: 'c1',
      email: 'Persona@Empresa.COM',
      role: 'RECRUITER',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('persona@empresa.com');
  });

  it('rechaza el rol CANDIDATE como miembro invitable', () => {
    const r = inviteMemberSchema.safeParse({
      companyId: 'c1',
      email: 'a@b.com',
      role: 'CANDIDATE',
    });
    expect(r.success).toBe(false);
  });
});
