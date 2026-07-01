import { z } from 'zod';

/** Estructura de una pregunta de opción múltiple de una evaluación. */
export const questionSchema = z.object({
  text: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
});

export const questionsSchema = z.array(questionSchema).min(1).max(20);

export type Question = z.infer<typeof questionSchema>;

/** Parsea de forma segura el JSON de preguntas guardado en Evaluation.questions. */
export function parseQuestions(raw: unknown): Question[] {
  const result = questionsSchema.safeParse(raw);
  return result.success ? result.data : [];
}

/**
 * Califica respuestas: `answers[i]` es el índice elegido para la pregunta i.
 * Devuelve aciertos y total.
 */
export function gradeAnswers(
  questions: Question[],
  answers: number[],
): { correct: number; total: number } {
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  return { correct, total: questions.length };
}
