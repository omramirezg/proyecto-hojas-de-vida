import OpenAI from 'openai';
import { questionsSchema, type Question } from './questions';
import type { EvaluationType } from '@prisma/client';

/**
 * Genera una prueba de opción múltiple alineada al análisis del cargo, usando IA.
 * Requiere OPENAI_API_KEY. Devuelve preguntas validadas (o lanza si no se puede).
 */

export interface JobForEvaluation {
  title: string;
  type: EvaluationType; // TECHNICAL o SOFT
  objective?: string | null;
  functions: string[];
  responsibilities: string[];
  technicalSkills: string[];
  softSkills: string[];
  education?: string | null;
  experience?: string | null;
}

export function isAIEvaluationConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const SYSTEM = `Eres un experto en selección de personal que diseña pruebas de evaluación.
Genera EXACTAMENTE 5 preguntas de opción múltiple, en español, alineadas al cargo descrito.
Cada pregunta debe tener 4 opciones y una sola correcta.
Devuelve SOLO un JSON con esta forma:
{ "questions": [ { "text": string, "options": [string, string, string, string], "correctIndex": number } ] }
Reglas:
- Si el tipo es "TECHNICAL": preguntas técnicas/conocimiento del cargo.
- Si el tipo es "SOFT": preguntas situacionales de habilidades blandas (elige la mejor conducta).
- correctIndex es el índice (0-3) de la opción correcta.
- Preguntas claras, sin ambigüedad, de dificultad media. No repitas preguntas.`;

export async function generateEvaluationQuestions(job: JobForEvaluation): Promise<Question[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('AI_NOT_CONFIGURED');

  const client = new OpenAI({ apiKey });
  const model = process.env.AI_MODEL_EXTRACTION || 'gpt-4o-mini';

  const context = [
    `Cargo: ${job.title}`,
    `Tipo de prueba: ${job.type}`,
    job.objective ? `Objetivo: ${job.objective}` : '',
    job.functions.length ? `Funciones: ${job.functions.join('; ')}` : '',
    job.responsibilities.length ? `Responsabilidades: ${job.responsibilities.join('; ')}` : '',
    job.technicalSkills.length ? `Habilidades técnicas: ${job.technicalSkills.join(', ')}` : '',
    job.softSkills.length ? `Habilidades blandas: ${job.softSkills.join(', ')}` : '',
    job.education ? `Formación: ${job.education}` : '',
    job.experience ? `Experiencia: ${job.experience}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Datos del cargo:\n${context}` },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('AI_EMPTY_RESPONSE');

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error('AI_INVALID_JSON');
  }

  const questionsRaw = (json as { questions?: unknown }).questions;
  const parsed = questionsSchema.safeParse(questionsRaw);
  if (!parsed.success) throw new Error('AI_INVALID_QUESTIONS');

  // Normaliza correctIndex fuera de rango.
  return parsed.data.map((q) => ({
    ...q,
    correctIndex: q.correctIndex < q.options.length ? q.correctIndex : 0,
  }));
}
