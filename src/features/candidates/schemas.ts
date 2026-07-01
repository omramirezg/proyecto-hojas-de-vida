import { z } from 'zod';
import { optionalText } from '@/lib/zod-helpers';

export const candidateSourceEnum = z.enum(['MANUAL', 'UPLOAD', 'LINKEDIN', 'OTHER']);

export const applicationStatusEnum = z.enum([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional()
  .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: 'Correo electrónico inválido.',
  });

export const candidateCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'Máximo 150 caracteres.'),
  email: optionalEmail,
  phone: optionalText,
  source: candidateSourceEnum.optional().or(z.literal('').transform(() => undefined)),
  notes: optionalText,
  /** Vacante a la que se asocia de inmediato (opcional). */
  jobId: optionalText,
});

export const applyToJobSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
});

export const changeApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusEnum,
});

export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;
