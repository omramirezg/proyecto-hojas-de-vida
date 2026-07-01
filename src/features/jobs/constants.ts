import type { CriteriaDimension, JobStatus, WorkMode } from '@prisma/client';

export const CRITERIA_DIMENSIONS: {
  dimension: CriteriaDimension;
  label: string;
  hint: string;
  defaultWeight: number;
}[] = [
  {
    dimension: 'TECHNICAL_SKILLS',
    label: 'Habilidades técnicas',
    hint: 'Dominio de herramientas, lenguajes o conocimientos del cargo.',
    defaultWeight: 40,
  },
  {
    dimension: 'EXPERIENCE',
    label: 'Experiencia',
    hint: 'Años y relevancia de la experiencia previa.',
    defaultWeight: 25,
  },
  {
    dimension: 'EDUCATION',
    label: 'Formación académica',
    hint: 'Nivel de estudios y pertinencia.',
    defaultWeight: 15,
  },
  {
    dimension: 'LANGUAGES',
    label: 'Idiomas',
    hint: 'Idiomas requeridos y nivel.',
    defaultWeight: 10,
  },
  {
    dimension: 'LOCATION',
    label: 'Ubicación',
    hint: 'Cercanía o compatibilidad con la modalidad de trabajo.',
    defaultWeight: 10,
  },
  {
    dimension: 'CERTIFICATIONS',
    label: 'Certificaciones',
    hint: 'Certificaciones deseables o requeridas.',
    defaultWeight: 0,
  },
  {
    dimension: 'SOFT_SKILLS',
    label: 'Habilidades blandas',
    hint: 'Competencias interpersonales y de comportamiento.',
    defaultWeight: 0,
  },
  {
    dimension: 'EVALUATIONS',
    label: 'Resultados de evaluaciones',
    hint: 'Puntajes de pruebas técnicas y blandas (Fase 7).',
    defaultWeight: 0,
  },
];

export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: 'REMOTE', label: 'Remoto' },
  { value: 'HYBRID', label: 'Híbrido' },
  { value: 'ONSITE', label: 'Presencial' },
];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ONSITE: 'Presencial',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  CLOSED: 'Cerrada',
  ARCHIVED: 'Archivada',
};

export const JOB_STATUS_BADGE: Record<JobStatus, 'secondary' | 'success' | 'warning' | 'outline'> =
  {
    DRAFT: 'secondary',
    PUBLISHED: 'success',
    CLOSED: 'warning',
    ARCHIVED: 'outline',
  };

export const CURRENCIES = ['USD', 'COP', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL', 'UYU', 'EUR'] as const;
