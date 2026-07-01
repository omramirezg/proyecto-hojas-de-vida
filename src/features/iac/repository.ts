import { db } from '@/lib/db';
import type { IacResult } from './engine';
import type { Prisma } from '@prisma/client';

/** Persistencia de los resultados del IAC. */

export async function saveIacScore(params: {
  companyId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  result: IacResult;
}) {
  const { companyId, applicationId, candidateId, jobId, result } = params;

  const scoreData = {
    companyId,
    candidateId,
    jobId,
    overall: result.overall,
    category: result.category,
    explanation: result.explanation,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    risks: result.risks,
    engineVersion: result.engineVersion,
  };

  const detailData = result.details.map((d) => ({
    dimension: d.dimension,
    weight: d.weight,
    rawScore: d.rawScore,
    applicable: d.applicable,
    note: d.note,
  }));

  // Reemplaza el score y su desglose de forma atómica.
  return db.$transaction(async (tx) => {
    const existing = await tx.iACScore.findUnique({ where: { applicationId } });
    if (existing) {
      await tx.iACScoreDetail.deleteMany({ where: { scoreId: existing.id } });
    }
    return tx.iACScore.upsert({
      where: { applicationId },
      update: { ...scoreData, details: { create: detailData } },
      create: { applicationId, ...scoreData, details: { create: detailData } },
      include: { details: true },
    });
  });
}

export async function getIacScore(companyId: string, applicationId: string) {
  return db.iACScore.findFirst({
    where: { applicationId, companyId },
    include: { details: true },
  });
}

/** Ranking de una vacante: postulaciones con su IAC (si existe), ordenadas. */
export async function getJobRanking(companyId: string, jobId: string) {
  return db.candidateApplication.findMany({
    where: { companyId, jobId },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          source: true,
          standardizedResume: { select: { id: true } },
        },
      },
      iacScore: { include: { details: true } },
    },
  });
}

export type RankingRow = Prisma.CandidateApplicationGetPayload<{
  include: {
    candidate: {
      select: {
        id: true;
        fullName: true;
        source: true;
        standardizedResume: { select: { id: true } };
      };
    };
    iacScore: { include: { details: true } };
  };
}>;
