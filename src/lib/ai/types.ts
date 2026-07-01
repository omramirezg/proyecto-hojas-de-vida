import { z } from 'zod';

/**
 * Estructura del CV tras el parseo por IA.
 * Se separa explícitamente en `visible` (no sesgante, alimenta el IAC y el
 * reclutamiento ciego) y `hidden` (datos sesgantes, acceso restringido).
 */

export const parsedLanguageSchema = z.object({
  language: z.string().trim().min(1),
  level: z.string().trim().optional().nullable(),
});

export const parsedPositionSchema = z.object({
  title: z.string().trim().min(1),
  org: z.string().trim().optional().nullable(),
  years: z.number().nonnegative().optional().nullable(),
});

export const parsedVisibleSchema = z.object({
  summary: z.string().trim().optional().nullable(),
  yearsExperience: z.number().nonnegative().max(70).optional().nullable(),
  technicalSkills: z.array(z.string().trim().min(1)).default([]),
  softSkills: z.array(z.string().trim().min(1)).default([]),
  languages: z.array(parsedLanguageSchema).default([]),
  certifications: z.array(z.string().trim().min(1)).default([]),
  educationLevel: z.string().trim().optional().nullable(),
  degrees: z.array(z.string().trim().min(1)).default([]),
  positions: z.array(parsedPositionSchema).default([]),
  locationCity: z.string().trim().optional().nullable(),
  locationCountry: z.string().trim().optional().nullable(),
});

export const parsedHiddenSchema = z.object({
  fullName: z.string().trim().optional().nullable(),
  hasPhoto: z.boolean().default(false),
  age: z.number().int().positive().max(120).optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  institutions: z.array(z.string().trim().min(1)).default([]),
  specificAddress: z.string().trim().optional().nullable(),
});

export const parsedResumeSchema = z.object({
  visible: parsedVisibleSchema,
  hidden: parsedHiddenSchema,
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export type ParsedVisible = z.infer<typeof parsedVisibleSchema>;
export type ParsedHidden = z.infer<typeof parsedHiddenSchema>;

export interface AIProvider {
  readonly name: string;
  parseResume(text: string): Promise<ParsedResume>;
}
