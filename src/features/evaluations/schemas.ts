import { z } from 'zod';
import { optionalText } from '@/lib/zod-helpers';

export const evaluationTypeEnum = z.enum(['TECHNICAL', 'SOFT']);

export const evaluationCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres.')
    .max(150, 'Máximo 150 caracteres.'),
  type: evaluationTypeEnum,
  description: optionalText,
  maxScore: z.coerce
    .number()
    .int()
    .min(1, 'El puntaje máximo debe ser al menos 1.')
    .max(1000, 'Máximo 1000.'),
});

export const assignEvaluationSchema = z.object({
  jobId: z.string().min(1),
  evaluationId: z.string().min(1),
});

export const recordResultSchema = z
  .object({
    evaluationId: z.string().min(1, 'Selecciona una evaluación.'),
    candidateId: z.string().min(1),
    score: z.coerce.number().min(0, 'El puntaje no puede ser negativo.'),
    maxScore: z.coerce.number().int().min(1),
    notes: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.score > data.maxScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['score'],
        message: `El puntaje no puede superar el máximo (${data.maxScore}).`,
      });
    }
  });

export type EvaluationCreateInput = z.infer<typeof evaluationCreateSchema>;
export type RecordResultInput = z.infer<typeof recordResultSchema>;
