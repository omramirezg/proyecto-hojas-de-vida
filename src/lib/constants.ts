import type { CompanySize } from '@prisma/client';

/** Catálogos compartidos para formularios (sector, tamaño, país). */

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: 'MICRO', label: 'Microempresa (1-10)' },
  { value: 'SMALL', label: 'Pequeña (11-50)' },
  { value: 'MEDIUM', label: 'Mediana (51-200)' },
  { value: 'LARGE', label: 'Grande (200+)' },
];

export const COMPANY_SECTORS = [
  'Tecnología',
  'Comercio / Retail',
  'Servicios profesionales',
  'Salud',
  'Educación',
  'Manufactura',
  'Construcción',
  'Finanzas',
  'Turismo / Hospitalidad',
  'Agroindustria',
  'Logística / Transporte',
  'Marketing / Publicidad',
  'Otro',
] as const;

/** Países de LATAM (código ISO-3166-1 alfa-2 → nombre). */
export const LATAM_COUNTRIES: { code: string; name: string }[] = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Perú' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' },
];

export function countryName(code?: string | null): string | undefined {
  if (!code) return undefined;
  return LATAM_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
