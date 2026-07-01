import type { CriteriaDimension, IACCategory, WorkMode } from '@prisma/client';

/**
 * Motor del Índice de Ajuste al Cargo (IAC).
 *
 * DETERMINISTA y AUDITABLE: dada la misma entrada, produce siempre el mismo
 * resultado. La IA NO interviene aquí (solo extrae datos en la Fase 5).
 * Nunca usa datos sesgantes (nombre, foto, edad, género, universidad, dirección).
 *
 * Para cada dimensión con peso > 0:
 *  - Si la vacante define un requisito → la dimensión es "aplicable" y se puntúa 0-100.
 *  - Si no define requisito → "no aplicable": su peso se excluye y se redistribuye.
 * IAC = Σ(score_i · weight_i) / Σ(weight_i)  sobre dimensiones aplicables.
 */

export const IAC_ENGINE_VERSION = 'iac-1.0.0';

export interface IacJobInput {
  criteria: { dimension: CriteriaDimension; weight: number }[];
  technicalSkills: string[];
  softSkills: string[];
  languages: string[]; // p. ej. "Inglés - B2"
  certifications: string[];
  experienceYears: number | null;
  education: string | null;
  location: string | null;
  workMode: WorkMode | null;
}

export interface IacCandidateInput {
  technicalSkills: string[];
  softSkills: string[];
  languages: { language: string; level?: string | null }[];
  certifications: string[];
  yearsExperience: number | null;
  educationLevel: string | null;
  degrees: string[];
  locationCity: string | null;
  locationCountry: string | null;
  /** Promedio 0-100 de evaluaciones (Fase 7). null si aún no hay. */
  evaluationScore?: number | null;
}

export interface IacDimensionResult {
  dimension: CriteriaDimension;
  weight: number;
  applicable: boolean;
  rawScore: number; // 0-100
  note: string;
}

export interface IacResult {
  overall: number; // 0-100
  category: IACCategory;
  explanation: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  details: IacDimensionResult[];
  engineVersion: string;
}

// ── Utilidades de normalización ──────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 3);
}

/** Coincidencia laxa de habilidades: igualdad o inclusión por substring normalizado. */
function matchItems(required: string[], candidate: string[]): { matched: number; total: number } {
  const cand = candidate.map(normalize).filter(Boolean);
  const req = required.map(normalize).filter(Boolean);
  if (req.length === 0) return { matched: 0, total: 0 };
  let matched = 0;
  for (const r of req) {
    if (cand.some((c) => c === r || c.includes(r) || r.includes(c))) matched += 1;
  }
  return { matched, total: req.length };
}

const LEVEL_RANK: Record<string, number> = {
  a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
  basico: 2, intermedio: 3, avanzado: 5, fluido: 5, nativo: 6,
};

function levelRank(level?: string | null): number | null {
  if (!level) return null;
  const key = normalize(level).match(/a1|a2|b1|b2|c1|c2|basico|intermedio|avanzado|fluido|nativo/)?.[0];
  return key ? (LEVEL_RANK[key] ?? null) : null;
}

function parseRequiredLanguage(raw: string): { name: string; level?: string } {
  // Acepta "Inglés - B2", "Inglés B2", "Inglés"
  const parts = raw.split(/[-:]/);
  if (parts.length >= 2) return { name: parts[0]!.trim(), level: parts.slice(1).join(' ').trim() };
  const m = raw.match(/^(.*?)\s+(a1|a2|b1|b2|c1|c2|b[aá]sico|intermedio|avanzado|fluido|nativo)\s*$/i);
  if (m) return { name: m[1]!.trim(), level: m[2] };
  return { name: raw.trim() };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ── Puntuadores por dimensión ────────────────────────────────────
// Devuelven { applicable, score, note }. applicable=false → la vacante no define
// el requisito y la dimensión se excluye del cálculo.

type DimScore = { applicable: boolean; score: number; note: string };

function scoreSkills(required: string[], candidate: string[], labelOk: string): DimScore {
  if (required.length === 0) return { applicable: false, score: 0, note: 'La vacante no define este requisito.' };
  const { matched, total } = matchItems(required, candidate);
  const score = clamp((matched / total) * 100);
  return { applicable: true, score, note: `Cumple ${matched}/${total} ${labelOk}.` };
}

function scoreExperience(required: number | null, candidate: number | null): DimScore {
  if (required == null || required <= 0)
    return { applicable: false, score: 0, note: 'La vacante no define años de experiencia.' };
  const years = candidate ?? 0;
  const score = clamp((Math.min(years, required) / required) * 100);
  return {
    applicable: true,
    score,
    note: `${years} año(s) frente a ${required} requerido(s).`,
  };
}

function scoreEducation(required: string | null, degrees: string[], level: string | null): DimScore {
  if (!required || required.trim() === '')
    return { applicable: false, score: 0, note: 'La vacante no define formación.' };
  const reqTokens = new Set(significantTokens(required));
  const candText = [...degrees, level ?? ''].join(' ');
  const candTokens = new Set(significantTokens(candText));
  if (candTokens.size === 0) return { applicable: true, score: 0, note: 'Sin formación registrada en el CV.' };
  let overlap = 0;
  for (const t of reqTokens) if (candTokens.has(t)) overlap += 1;
  const ratio = reqTokens.size > 0 ? overlap / reqTokens.size : 0;
  // Coincidencia de área → 60-100; sin coincidencia pero con título → 40.
  const score = overlap > 0 ? clamp(60 + ratio * 40) : 40;
  return {
    applicable: true,
    score,
    note: overlap > 0 ? 'Formación afín al requisito.' : 'Tiene formación, no necesariamente del área.',
  };
}

function scoreLanguages(
  required: string[],
  candidate: { language: string; level?: string | null }[],
): DimScore {
  if (required.length === 0)
    return { applicable: false, score: 0, note: 'La vacante no define idiomas.' };
  const reqs = required.map(parseRequiredLanguage);
  let sum = 0;
  for (const r of reqs) {
    const reqName = normalize(r.name);
    const found = candidate.find((c) => normalize(c.language).includes(reqName) || reqName.includes(normalize(c.language)));
    if (!found) {
      sum += 0;
      continue;
    }
    const reqRank = levelRank(r.level);
    const candRank = levelRank(found.level);
    if (reqRank == null) sum += 100; // no se exige nivel
    else if (candRank == null) sum += 70; // tiene el idioma, nivel no claro
    else sum += clamp((Math.min(candRank, reqRank) / reqRank) * 100);
  }
  return { applicable: true, score: clamp(sum / reqs.length), note: `${reqs.length} idioma(s) evaluado(s).` };
}

function scoreLocation(
  jobLocation: string | null,
  workMode: WorkMode | null,
  city: string | null,
  country: string | null,
): DimScore {
  if (workMode === 'REMOTE')
    return { applicable: true, score: 100, note: 'Modalidad remota: ubicación no es barrera.' };
  if (!jobLocation || jobLocation.trim() === '')
    return { applicable: false, score: 0, note: 'La vacante no define ubicación.' };
  const candTokens = new Set(significantTokens([city ?? '', country ?? ''].join(' ')));
  if (candTokens.size === 0) return { applicable: true, score: 0, note: 'Sin ubicación en el CV.' };
  const jobTokens = significantTokens(jobLocation);
  const cityNorm = normalize(city ?? '');
  const matchCity = cityNorm && jobTokens.some((t) => t === cityNorm || cityNorm.includes(t));
  if (matchCity) return { applicable: true, score: 100, note: 'Misma ciudad.' };
  const countryNorm = normalize(country ?? '');
  const matchCountry = countryNorm && jobTokens.some((t) => t === countryNorm);
  if (matchCountry) return { applicable: true, score: 70, note: 'Mismo país, distinta ciudad.' };
  return { applicable: true, score: 20, note: 'Ubicación distinta (posible reubicación).' };
}

function scoreEvaluations(evaluationScore: number | null | undefined): DimScore {
  if (evaluationScore == null)
    return { applicable: false, score: 0, note: 'Aún sin evaluaciones (Fase 7).' };
  return { applicable: true, score: clamp(evaluationScore), note: `Promedio de evaluaciones: ${clamp(evaluationScore)}/100.` };
}

// ── Etiquetas y categoría ────────────────────────────────────────

const DIMENSION_LABEL: Record<CriteriaDimension, string> = {
  TECHNICAL_SKILLS: 'habilidades técnicas',
  EXPERIENCE: 'experiencia',
  EDUCATION: 'formación',
  LANGUAGES: 'idiomas',
  CERTIFICATIONS: 'certificaciones',
  LOCATION: 'ubicación',
  SOFT_SKILLS: 'habilidades blandas',
  EVALUATIONS: 'evaluaciones',
};

export function categoryFor(overall: number): IACCategory {
  if (overall >= 90) return 'EXCELLENT';
  if (overall >= 75) return 'GOOD';
  if (overall >= 60) return 'PARTIAL';
  return 'NOT_RECOMMENDED';
}

// ── Cálculo principal ────────────────────────────────────────────

export function computeIAC(job: IacJobInput, candidate: IacCandidateInput): IacResult {
  const scorers: Record<CriteriaDimension, () => DimScore> = {
    TECHNICAL_SKILLS: () => scoreSkills(job.technicalSkills, candidate.technicalSkills, 'habilidades técnicas'),
    SOFT_SKILLS: () => scoreSkills(job.softSkills, candidate.softSkills, 'habilidades blandas'),
    CERTIFICATIONS: () => scoreSkills(job.certifications, candidate.certifications, 'certificaciones'),
    EXPERIENCE: () => scoreExperience(job.experienceYears, candidate.yearsExperience),
    EDUCATION: () => scoreEducation(job.education, candidate.degrees, candidate.educationLevel),
    LANGUAGES: () => scoreLanguages(job.languages, candidate.languages),
    LOCATION: () => scoreLocation(job.location, job.workMode, candidate.locationCity, candidate.locationCountry),
    EVALUATIONS: () => scoreEvaluations(candidate.evaluationScore),
  };

  const details: IacDimensionResult[] = [];
  for (const { dimension, weight } of job.criteria) {
    if (weight <= 0) continue; // dimensiones sin peso no participan
    const { applicable, score, note } = scorers[dimension]();
    details.push({ dimension, weight, applicable, rawScore: applicable ? score : 0, note });
  }

  const applicable = details.filter((d) => d.applicable);
  const totalWeight = applicable.reduce((acc, d) => acc + d.weight, 0);
  const overall =
    totalWeight > 0
      ? clamp(applicable.reduce((acc, d) => acc + d.rawScore * d.weight, 0) / totalWeight)
      : 0;

  const category = categoryFor(overall);

  // Fortalezas / debilidades / riesgos
  const strengths = applicable
    .filter((d) => d.rawScore >= 80)
    .map((d) => `Buen ajuste en ${DIMENSION_LABEL[d.dimension]} (${d.rawScore}/100).`);
  const weaknesses = applicable
    .filter((d) => d.rawScore < 60)
    .map((d) => `Bajo ajuste en ${DIMENSION_LABEL[d.dimension]} (${d.rawScore}/100).`);

  const risks: string[] = [];
  const tech = details.find((d) => d.dimension === 'TECHNICAL_SKILLS');
  if (tech?.applicable && tech.rawScore < 50)
    risks.push('No cumple varias habilidades técnicas requeridas.');
  const exp = details.find((d) => d.dimension === 'EXPERIENCE');
  if (exp?.applicable && exp.rawScore < 100) risks.push('Experiencia por debajo de lo requerido.');
  if (!details.some((d) => d.dimension === 'EVALUATIONS' && d.applicable))
    risks.push('Aún sin resultados de evaluaciones que respalden el ajuste.');
  if (totalWeight === 0)
    risks.push('No se pudo evaluar ninguna dimensión con la información disponible.');

  return {
    overall,
    category,
    explanation: buildExplanation(overall, category, details),
    strengths,
    weaknesses,
    risks,
    details,
    engineVersion: IAC_ENGINE_VERSION,
  };
}

const CATEGORY_TEXT: Record<IACCategory, string> = {
  EXCELLENT: 'excelente ajuste',
  GOOD: 'buen ajuste',
  PARTIAL: 'ajuste parcial',
  NOT_RECOMMENDED: 'no recomendado',
};

function buildExplanation(
  overall: number,
  category: IACCategory,
  details: IacDimensionResult[],
): string {
  const applicable = details.filter((d) => d.applicable);
  if (applicable.length === 0) {
    return `IAC de ${overall}: no fue posible evaluar el ajuste por falta de datos del candidato o de criterios definidos.`;
  }
  const ranked = [...applicable].sort((a, b) => b.weight - a.weight);
  const phrases = ranked
    .slice(0, 4)
    .map((d) => `${DIMENSION_LABEL[d.dimension]} ${d.rawScore}/100`);
  return `El candidato obtuvo un IAC de ${overall} (${CATEGORY_TEXT[category]}). Desglose principal: ${phrases.join(', ')}.`;
}
