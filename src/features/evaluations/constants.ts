import type { EvaluationType } from '@prisma/client';

export const EVALUATION_TYPES: { value: EvaluationType; label: string }[] = [
  { value: 'TECHNICAL', label: 'Técnica' },
  { value: 'SOFT', label: 'Blanda' },
];

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  TECHNICAL: 'Técnica',
  SOFT: 'Blanda',
};

export const EVALUATION_TYPE_BADGE: Record<EvaluationType, 'default' | 'secondary'> = {
  TECHNICAL: 'default',
  SOFT: 'secondary',
};
