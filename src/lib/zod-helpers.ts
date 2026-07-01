import { z } from 'zod';

/** Texto opcional: '' → undefined. */
export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

/** Entero opcional no negativo: '' o ausente → undefined. */
export const optionalInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional(),
);

/** Lista de strings no vacíos (ya parseada desde JSON). */
export const stringArray = z
  .array(z.string().trim().min(1))
  .max(50, 'Demasiados elementos (máx. 50).')
  .default([]);
