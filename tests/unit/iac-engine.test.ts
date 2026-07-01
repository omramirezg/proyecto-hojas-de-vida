import { describe, it, expect } from 'vitest';
import { computeIAC, categoryFor, type IacJobInput, type IacCandidateInput } from '@/features/iac/engine';

const baseJob: IacJobInput = {
  criteria: [
    { dimension: 'TECHNICAL_SKILLS', weight: 40 },
    { dimension: 'EXPERIENCE', weight: 25 },
    { dimension: 'EDUCATION', weight: 15 },
    { dimension: 'LANGUAGES', weight: 10 },
    { dimension: 'LOCATION', weight: 10 },
    { dimension: 'CERTIFICATIONS', weight: 0 },
    { dimension: 'SOFT_SKILLS', weight: 0 },
    { dimension: 'EVALUATIONS', weight: 0 },
  ],
  technicalSkills: ['JavaScript', 'React', 'PostgreSQL', 'Docker'],
  softSkills: [],
  languages: ['Inglés - B2'],
  certifications: [],
  experienceYears: 5,
  education: 'Ingeniería de Sistemas',
  location: 'Bogotá, Colombia',
  workMode: 'ONSITE',
};

const strongCandidate: IacCandidateInput = {
  technicalSkills: ['JavaScript', 'React', 'PostgreSQL', 'Docker'],
  softSkills: [],
  languages: [{ language: 'Inglés', level: 'B2' }],
  certifications: [],
  yearsExperience: 6,
  educationLevel: 'Pregrado',
  degrees: ['Ingeniería de Sistemas'],
  locationCity: 'Bogotá',
  locationCountry: 'Colombia',
  evaluationScore: null,
};

describe('categoryFor', () => {
  it('clasifica según los rangos definidos', () => {
    expect(categoryFor(95)).toBe('EXCELLENT');
    expect(categoryFor(80)).toBe('GOOD');
    expect(categoryFor(65)).toBe('PARTIAL');
    expect(categoryFor(40)).toBe('NOT_RECOMMENDED');
  });
});

describe('computeIAC', () => {
  it('da un IAC alto a un candidato que cumple todo', () => {
    const r = computeIAC(baseJob, strongCandidate);
    expect(r.overall).toBeGreaterThanOrEqual(90);
    expect(r.category).toBe('EXCELLENT');
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it('es determinista (misma entrada → mismo resultado)', () => {
    const a = computeIAC(baseJob, strongCandidate);
    const b = computeIAC(baseJob, strongCandidate);
    expect(a.overall).toBe(b.overall);
    expect(a.explanation).toBe(b.explanation);
  });

  it('penaliza habilidades técnicas faltantes', () => {
    const weak = { ...strongCandidate, technicalSkills: ['React'] };
    const r = computeIAC(baseJob, weak);
    const tech = r.details.find((d) => d.dimension === 'TECHNICAL_SKILLS');
    expect(tech?.rawScore).toBe(25); // 1 de 4
    expect(r.overall).toBeLessThan(90);
  });

  it('penaliza experiencia por debajo de lo requerido', () => {
    const junior = { ...strongCandidate, yearsExperience: 1 };
    const r = computeIAC(baseJob, junior);
    const exp = r.details.find((d) => d.dimension === 'EXPERIENCE');
    expect(exp?.rawScore).toBe(20); // 1/5
    expect(r.risks.some((x) => x.toLowerCase().includes('experiencia'))).toBe(true);
  });

  it('excluye dimensiones sin peso y las no aplicables', () => {
    const r = computeIAC(baseJob, strongCandidate);
    // CERTIFICATIONS/SOFT_SKILLS/EVALUATIONS tienen peso 0 → no aparecen en el desglose
    expect(r.details.some((d) => d.dimension === 'CERTIFICATIONS')).toBe(false);
    expect(r.details.some((d) => d.dimension === 'EVALUATIONS')).toBe(false);
  });

  it('marca ubicación remota como sin barrera', () => {
    const remoteJob = { ...baseJob, workMode: 'REMOTE' as const, location: null };
    const candNoLoc = { ...strongCandidate, locationCity: null, locationCountry: null };
    const r = computeIAC(remoteJob, candNoLoc);
    const loc = r.details.find((d) => d.dimension === 'LOCATION');
    expect(loc?.applicable).toBe(true);
    expect(loc?.rawScore).toBe(100);
  });

  it('da 0 y categoría no recomendado cuando no hay datos del candidato', () => {
    const empty: IacCandidateInput = {
      technicalSkills: [],
      softSkills: [],
      languages: [],
      certifications: [],
      yearsExperience: null,
      educationLevel: null,
      degrees: [],
      locationCity: null,
      locationCountry: null,
      evaluationScore: null,
    };
    const r = computeIAC(baseJob, empty);
    expect(r.overall).toBeLessThan(60);
    expect(r.category).toBe('NOT_RECOMMENDED');
  });

  it('el IAC nunca se sale del rango 0-100', () => {
    const r = computeIAC(baseJob, strongCandidate);
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
  });
});
