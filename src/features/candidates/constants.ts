import type { ApplicationStatus, CandidateSource, ResumeStatus } from '@prisma/client';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Postulado',
  SCREENING: 'En revisión',
  INTERVIEW: 'Entrevista',
  OFFER: 'Oferta',
  HIRED: 'Contratado',
  REJECTED: 'Descartado',
  WITHDRAWN: 'Retirado',
};

export const APPLICATION_STATUS_BADGE: Record<
  ApplicationStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
> = {
  APPLIED: 'secondary',
  SCREENING: 'default',
  INTERVIEW: 'warning',
  OFFER: 'default',
  HIRED: 'success',
  REJECTED: 'destructive',
  WITHDRAWN: 'outline',
};

export const CANDIDATE_SOURCES: { value: CandidateSource; label: string }[] = [
  { value: 'MANUAL', label: 'Ingreso manual' },
  { value: 'UPLOAD', label: 'Carga de CV' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'OTHER', label: 'Otro' },
];

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  MANUAL: 'Ingreso manual',
  UPLOAD: 'Carga de CV',
  LINKEDIN: 'LinkedIn',
  OTHER: 'Otro',
};

export const RESUME_STATUS_LABELS: Record<ResumeStatus, string> = {
  UPLOADED: 'Cargado',
  PROCESSING: 'Procesando',
  PROCESSED: 'Procesado',
  FAILED: 'Error',
};

/** Atributo accept del input file (extensiones aceptadas en la UI). */
export const RESUME_ACCEPT = '.pdf,.doc,.docx';
