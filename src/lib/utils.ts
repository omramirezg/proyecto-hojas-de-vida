import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases de Tailwind resolviendo conflictos (patrón estándar de shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Genera un slug URL-safe a partir de un texto (p. ej. nombre de empresa). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Iniciales para avatares de respaldo. */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const a = firstName?.[0] ?? '';
  const b = lastName?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}
