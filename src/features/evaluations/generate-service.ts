import { db } from '@/lib/db';
import { recordAudit } from '@/features/audit/service';
import { generateEvaluationQuestions, type JobForEvaluation } from './ai-generate';
import { parseQuestions, gradeAnswers } from './questions';
import * as repo from './repository';
import type { EvaluationType } from '@prisma/client';

/** Genera con IA una prueba alineada al cargo y la asigna a la vacante. */
export async function generateEvaluationForJob(
  companyId: string,
  jobId: string,
  type: EvaluationType,
  actorId: string,
) {
  const job = await db.job.findFirst({
    where: { id: jobId, companyId, deletedAt: null },
    select: {
      title: true,
      objective: true,
      functions: true,
      responsibilities: true,
      technicalSkills: true,
      softSkills: true,
      education: true,
      experience: true,
    },
  });
  if (!job) throw new Error('JOB_NOT_FOUND');

  const input: JobForEvaluation = { type, ...job };
  const questions = await generateEvaluationQuestions(input);

  const title = `${type === 'TECHNICAL' ? 'Prueba técnica' : 'Prueba de competencias'} — ${job.title}`;
  const evaluation = await repo.createGeneratedEvaluation({
    companyId,
    jobId,
    title,
    type,
    questions,
  });

  await recordAudit({
    action: 'evaluation.ai_generated',
    actorId,
    companyId,
    entityType: 'Evaluation',
    entityId: evaluation.id,
    metadata: { jobId, questions: questions.length },
  });

  return evaluation;
}

export interface SubmitResult {
  normalizedScore: number;
  correct: number;
  total: number;
}

/** Recibe respuestas del candidato (por token), califica y guarda el resultado. */
export async function submitEvaluationByToken(
  token: string,
  answers: number[],
): Promise<SubmitResult> {
  const assignment = await repo.getAssignmentByToken(token);
  if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');
  if (assignment.status === 'COMPLETED') throw new Error('ALREADY_COMPLETED');

  const questions = parseQuestions(assignment.evaluation.questions);
  if (questions.length === 0) throw new Error('NO_QUESTIONS');

  const { correct, total } = gradeAnswers(questions, answers);
  const normalizedScore = Math.round((correct / total) * 100);

  await db.$transaction(async (tx) => {
    await tx.evaluationResult.create({
      data: {
        companyId: assignment.companyId,
        evaluationId: assignment.evaluationId,
        candidateId: assignment.candidateId,
        score: correct,
        maxScore: total,
        normalizedScore,
        notes: 'Respondida en línea por el candidato.',
      },
    });
    await tx.evaluationAssignment.update({
      where: { id: assignment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  await recordAudit({
    action: 'evaluation.submitted_online',
    companyId: assignment.companyId,
    entityType: 'EvaluationAssignment',
    entityId: assignment.id,
    metadata: { normalizedScore, candidateId: assignment.candidateId },
  });

  return { normalizedScore, correct, total };
}
