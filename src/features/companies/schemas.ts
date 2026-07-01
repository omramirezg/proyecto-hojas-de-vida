import { z } from 'zod';

const companySizeEnum = z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE']);

/** Roles que se pueden invitar como miembros del equipo (no incluye CANDIDATE). */
export const invitableRoleEnum = z.enum(['COMPANY_ADMIN', 'RECRUITER', 'EVALUATOR']);

/** Normaliza un string opcional vacío a undefined. */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .optional()
  .refine((v) => v === undefined || z.string().url().safeParse(v).success, {
    message: 'Debe ser una URL válida (incluye https://).',
  });

export const companyCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'Máximo 120 caracteres.'),
  sector: optionalText,
  size: companySizeEnum.optional().or(z.literal('').transform(() => undefined)),
  country: optionalText,
  website: optionalUrl,
  logoUrl: optionalUrl,
});

export const companyUpdateSchema = companyCreateSchema.extend({
  companyId: z.string().min(1),
});

export const inviteMemberSchema = z.object({
  companyId: z.string().min(1),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido.'),
  role: invitableRoleEnum,
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
