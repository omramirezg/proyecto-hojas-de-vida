import { describe, it, expect } from 'vitest';
import { HeuristicProvider } from '@/lib/ai/heuristic-provider';
import { parsedResumeSchema } from '@/lib/ai/types';

const SAMPLE = `
Juana Pérez
Desarrolladora de software con 6 años de experiencia.
Habilidades: JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker, AWS.
Idiomas: Inglés B2, Español nativo.
`;

describe('HeuristicProvider', () => {
  it('devuelve una estructura válida según el schema', async () => {
    const result = await new HeuristicProvider().parseResume(SAMPLE);
    expect(parsedResumeSchema.safeParse(result).success).toBe(true);
  });

  it('detecta años de experiencia', async () => {
    const result = await new HeuristicProvider().parseResume(SAMPLE);
    expect(result.visible.yearsExperience).toBe(6);
  });

  it('detecta habilidades técnicas conocidas', async () => {
    const result = await new HeuristicProvider().parseResume(SAMPLE);
    expect(result.visible.technicalSkills).toEqual(
      expect.arrayContaining(['Typescript', 'React', 'Postgresql']),
    );
  });

  it('detecta idiomas con nivel', async () => {
    const result = await new HeuristicProvider().parseResume(SAMPLE);
    const ingles = result.visible.languages.find((l) => l.language.toLowerCase().includes('ingl'));
    expect(ingles?.level?.toLowerCase()).toBe('b2');
  });

  it('no expone datos sesgantes en modo heurístico', async () => {
    const result = await new HeuristicProvider().parseResume(SAMPLE);
    expect(result.hidden.fullName).toBeNull();
    expect(result.hidden.institutions).toEqual([]);
  });
});
