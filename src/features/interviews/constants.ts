import type { InterviewMode, InterviewStatus, HiringOutcome } from '@prisma/client';

export const INTERVIEW_MODES: { value: InterviewMode; label: string }[] = [
  { value: 'REMOTE', label: 'Videollamada' },
  { value: 'ONSITE', label: 'Presencial' },
  { value: 'PHONE', label: 'Telefónica' },
];

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  REMOTE: 'Videollamada',
  ONSITE: 'Presencial',
  PHONE: 'Telefónica',
};

export const INTERVIEW_STATUSES: InterviewStatus[] = [
  'SCHEDULED',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW',
];

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: 'Programada',
  COMPLETED: 'Realizada',
  CANCELED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

export const INTERVIEW_STATUS_BADGE: Record<
  InterviewStatus,
  'default' | 'success' | 'secondary' | 'destructive'
> = {
  SCHEDULED: 'default',
  COMPLETED: 'success',
  CANCELED: 'secondary',
  NO_SHOW: 'destructive',
};

export const HIRING_OUTCOME_LABELS: Record<HiringOutcome, string> = {
  SELECTED: 'Seleccionado',
  REJECTED: 'Descartado',
};

export const HIRING_OUTCOME_BADGE: Record<HiringOutcome, 'success' | 'destructive'> = {
  SELECTED: 'success',
  REJECTED: 'destructive',
};
