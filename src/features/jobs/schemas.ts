import { z } from 'zod';
import { optionalText, optionalInt, stringArray } from '@/lib/zod-helpers';

export const criteriaDimensionEnum = z.enum([
  'TECHNICAL_SKILLS',
  'EXPERIENCE',
  'EDUCATION',
  'LANGUAGES',
  'CERTIFICATIONS',
  'LOCATION',
  'SOFT_SKILLS',
  'EVALUATIONS',
]);

export const workModeEnum = z.enum(['REMOTE', 'HYBRID', 'ONSITE']);
export const jobStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']);

export const jobBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(150, 'Máximo 150 caracteres.'),
    objective: optionalText,
    functions: stringArray,
    responsibilities: stringArray,
    education: optionalText,
    experience: optionalText,
    experienceYears: optionalInt,
    technicalSkills: stringArray,
    softSkills: stringArray,
    languages: stringArray,
    certifications: stringArray,
    location: optionalText,
    workMode: workModeEnum.optional().or(z.literal('').transform(() => undefined)),
    salaryMin: optionalInt,
    salaryMax: optionalInt,
    salaryCurrency: optionalText,
  })
  .superRefine((data, ctx) => {
    if (
      data.salaryMin !== undefined &&
      data.salaryMax !== undefined &&
      data.salaryMax < data.salaryMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: 'El salario máximo no puede ser menor que el mínimo.',
      });
    }
  });

/** Validación de criterios: cada peso 0-100 y la SUMA debe ser exactamente 100. */
export const criteriaSchema = z
  .array(
    z.object({
      dimension: criteriaDimensionEnum,
      weight: z.coerce.number().int().min(0).max(100),
    }),
  )
  .superRefine((items, ctx) => {
    const total = items.reduce((acc, c) => acc + c.weight, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Los pesos deben sumar 100%. Actualmente suman ${total}%.`,
      });
    }
  });

export type JobBodyInput = z.infer<typeof jobBodySchema>;
export type CriteriaInput = z.infer<typeof criteriaSchema>;
