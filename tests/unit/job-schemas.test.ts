import { describe, it, expect } from 'vitest';
import { jobBodySchema, criteriaSchema } from '@/features/jobs/schemas';

describe('jobBodySchema', () => {
  it('acepta una vacante mínima (solo título)', () => {
    const r = jobBodySchema.safeParse({ title: 'Backend Dev' });
    expect(r.success).toBe(true);
  });

  it('rechaza títulos demasiado cortos', () => {
    expect(jobBodySchema.safeParse({ title: 'AB' }).success).toBe(false);
  });

  it('rechaza salario máximo menor que el mínimo', () => {
    const r = jobBodySchema.safeParse({ title: 'Dev', salaryMin: 2000, salaryMax: 1000 });
    expect(r.success).toBe(false);
  });

  it('normaliza enteros y campos vacíos', () => {
    const r = jobBodySchema.safeParse({ title: 'Dev', experienceYears: '5', salaryMin: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.experienceYears).toBe(5);
      expect(r.data.salaryMin).toBeUndefined();
    }
  });
});

describe('criteriaSchema (suma debe ser 100)', () => {
  const base = [
    { dimension: 'TECHNICAL_SKILLS', weight: 40 },
    { dimension: 'EXPERIENCE', weight: 25 },
    { dimension: 'EDUCATION', weight: 15 },
    { dimension: 'LANGUAGES', weight: 10 },
    { dimension: 'LOCATION', weight: 10 },
  ];

  it('acepta pesos que suman 100', () => {
    expect(criteriaSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza pesos que no suman 100', () => {
    const bad = [...base, { dimension: 'SOFT_SKILLS', weight: 5 }];
    const r = criteriaSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toContain('100%');
  });

  it('coacciona pesos string a número', () => {
    const r = criteriaSchema.safeParse([
      { dimension: 'TECHNICAL_SKILLS', weight: '60' },
      { dimension: 'EXPERIENCE', weight: '40' },
    ]);
    expect(r.success).toBe(true);
  });
});
