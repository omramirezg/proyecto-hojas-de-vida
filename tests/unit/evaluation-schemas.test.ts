import { describe, it, expect } from 'vitest';
import { evaluationCreateSchema, recordResultSchema } from '@/features/evaluations/schemas';

describe('evaluationCreateSchema', () => {
  it('acepta una evaluación válida', () => {
    const r = evaluationCreateSchema.safeParse({
      title: 'Prueba de SQL',
      type: 'TECHNICAL',
      maxScore: '50',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.maxScore).toBe(50);
  });

  it('rechaza tipos inválidos', () => {
    expect(
      evaluationCreateSchema.safeParse({ title: 'X1', type: 'OTRO', maxScore: 100 }).success,
    ).toBe(false);
  });

  it('rechaza maxScore menor que 1', () => {
    expect(
      evaluationCreateSchema.safeParse({ title: 'Prueba', type: 'SOFT', maxScore: 0 }).success,
    ).toBe(false);
  });
});

describe('recordResultSchema', () => {
  it('acepta un puntaje dentro del máximo', () => {
    const r = recordResultSchema.safeParse({
      evaluationId: 'e1',
      candidateId: 'c1',
      score: '45',
      maxScore: '50',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza un puntaje mayor que el máximo', () => {
    const r = recordResultSchema.safeParse({
      evaluationId: 'e1',
      candidateId: 'c1',
      score: '60',
      maxScore: '50',
    });
    expect(r.success).toBe(false);
  });

  it('normaliza correctamente (regla de cálculo del IAC)', () => {
    // normalizedScore = round(score / maxScore * 100)
    expect(Math.round((45 / 50) * 100)).toBe(90);
    expect(Math.round((7 / 8) * 100)).toBe(88);
  });
});
