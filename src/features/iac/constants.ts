import type { IACCategory } from '@prisma/client';

export const IAC_CATEGORY_LABELS: Record<IACCategory, string> = {
  EXCELLENT: 'Excelente ajuste',
  GOOD: 'Buen ajuste',
  PARTIAL: 'Ajuste parcial',
  NOT_RECOMMENDED: 'No recomendado',
};

export const IAC_CATEGORY_BADGE: Record<IACCategory, 'success' | 'default' | 'warning' | 'destructive'> = {
  EXCELLENT: 'success',
  GOOD: 'default',
  PARTIAL: 'warning',
  NOT_RECOMMENDED: 'destructive',
};

export const IAC_CATEGORY_RANGE: Record<IACCategory, string> = {
  EXCELLENT: '90-100',
  GOOD: '75-89',
  PARTIAL: '60-74',
  NOT_RECOMMENDED: '0-59',
};
