import { db } from '@/lib/db';
import type { EvaluationCreateInput } from './schemas';
import type { Prisma } from '@prisma/client';

/** Acceso a datos de evaluaciones, asignaciones y resultados. Siempre por tenant. */

export async function createEvaluation(companyId: string, data: EvaluationCreateInput) {
  return db.evaluation.create({
    data: {
      companyId,
      title: data.title,
      type: data.type,
      description: data.description ?? null,
      maxScore: data.maxScore,
    },
  });
}

export async function listEvaluations(companyId: string) {
  return db.evaluation.findMany({
    where: { companyId, deletedAt: null },
    include: { _count: { select: { results: true, jobLinks: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEvaluation(companyId: string, evaluationId: string) {
  return db.evaluation.findFirst({ where: { id: evaluationId, companyId, deletedAt: null } });
}

export async function assignEvaluationToJob(
  companyId: string,
  jobId: string,
  evaluationId: string,
) {
  return db.jobEvaluation.upsert({
    where: { jobId_evaluationId: { jobId, evaluationId } },
    update: {},
    create: { companyId, jobId, evaluationId },
  });
}

export async function unassignEvaluationFromJob(
  companyId: string,
  jobId: string,
  evaluationId: string,
) {
  return db.jobEvaluation.deleteMany({ where: { companyId, jobId, evaluationId } });
}

export async function listJobEvaluations(companyId: string, jobId: string) {
  return db.jobEvaluation.findMany({
    where: { companyId, jobId },
    include: { evaluation: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function recordResult(params: {
  companyId: string;
  evaluationId: string;
  candidateId: string;
  score: number;
  maxScore: number;
  normalizedScore: number;
  notes?: string | null;
  evaluatedById?: string | null;
}) {
  return db.evaluationResult.create({
    data: {
      companyId: params.companyId,
      evaluationId: params.evaluationId,
      candidateId: params.candidateId,
      score: params.score,
      maxScore: params.maxScore,
      normalizedScore: params.normalizedScore,
      notes: params.notes ?? null,
      evaluatedById: params.evaluatedById ?? null,
    },
  });
}

export async function listCandidateResults(companyId: string, candidateId: string) {
  return db.evaluationResult.findMany({
    where: { companyId, candidateId },
    include: { evaluation: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Promedio (0-100) que alimenta la dimensión EVALUATIONS del IAC.
 * Toma el resultado MÁS RECIENTE por evaluación y promedia sus normalizedScore.
 * Devuelve null si el candidato no tiene resultados.
 */
export async function getCandidateEvaluationAverage(
  companyId: string,
  candidateId: string,
): Promise<number | null> {
  const results = await db.evaluationResult.findMany({
    where: { companyId, candidateId },
    orderBy: { createdAt: 'desc' },
    select: { evaluationId: true, normalizedScore: true },
  });
  if (results.length === 0) return null;

  const latestByEvaluation = new Map<string, number>();
  for (const r of results) {
    if (!latestByEvaluation.has(r.evaluationId)) {
      latestByEvaluation.set(r.evaluationId, r.normalizedScore);
    }
  }
  const scores = [...latestByEvaluation.values()];
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export type EvaluationWithCount = Prisma.EvaluationGetPayload<{
  include: { _count: { select: { results: true; jobLinks: true } } };
}>;

export type ResultWithEvaluation = Prisma.EvaluationResultGetPayload<{
  include: { evaluation: true };
}>;
