import { db } from '@/lib/db';
import type { HiringOutcome, InterviewMode, InterviewStatus, Prisma } from '@prisma/client';

/** Acceso a datos de entrevistas y decisiones de contratación. Siempre por tenant. */

export async function getApplicationFull(companyId: string, applicationId: string) {
  return db.candidateApplication.findFirst({
    where: { id: applicationId, companyId },
    include: {
      job: { select: { id: true, title: true } },
      candidate: { select: { id: true, fullName: true, email: true } },
      iacScore: true,
      interviews: { orderBy: { scheduledAt: 'asc' } },
      hiringDecision: true,
    },
  });
}

export async function createInterview(params: {
  companyId: string;
  applicationId: string;
  scheduledAt: Date;
  mode: InterviewMode;
  location?: string | null;
  notes?: string | null;
  interviewerId?: string | null;
}) {
  // Programar una entrevista mueve la postulación a estado INTERVIEW.
  return db.$transaction(async (tx) => {
    const interview = await tx.interview.create({
      data: {
        companyId: params.companyId,
        applicationId: params.applicationId,
        scheduledAt: params.scheduledAt,
        mode: params.mode,
        location: params.location ?? null,
        notes: params.notes ?? null,
        interviewerId: params.interviewerId ?? null,
      },
    });
    await tx.candidateApplication.updateMany({
      where: { id: params.applicationId, companyId: params.companyId, status: { in: ['APPLIED', 'SCREENING'] } },
      data: { status: 'INTERVIEW' },
    });
    return interview;
  });
}

export async function updateInterview(
  companyId: string,
  interviewId: string,
  status: InterviewStatus,
  notes?: string | null,
) {
  return db.interview.updateMany({
    where: { id: interviewId, companyId },
    data: { status, notes: notes ?? undefined },
  });
}

/** Registra la decisión final y sincroniza el estado de la postulación. */
export async function decideHiring(params: {
  companyId: string;
  applicationId: string;
  decision: HiringOutcome;
  reason?: string | null;
  decidedById?: string | null;
}) {
  const newStatus = params.decision === 'SELECTED' ? 'HIRED' : 'REJECTED';
  return db.$transaction(async (tx) => {
    const decision = await tx.hiringDecision.upsert({
      where: { applicationId: params.applicationId },
      update: { decision: params.decision, reason: params.reason ?? null, decidedById: params.decidedById ?? null },
      create: {
        companyId: params.companyId,
        applicationId: params.applicationId,
        decision: params.decision,
        reason: params.reason ?? null,
        decidedById: params.decidedById ?? null,
      },
    });
    await tx.candidateApplication.updateMany({
      where: { id: params.applicationId, companyId: params.companyId },
      data: { status: newStatus },
    });
    return decision;
  });
}

/** Verifica que la postulación pertenezca a la empresa (para acciones por interviewId). */
export async function applicationBelongsToCompany(
  companyId: string,
  applicationId: string,
): Promise<boolean> {
  const app = await db.candidateApplication.findFirst({
    where: { id: applicationId, companyId },
    select: { id: true },
  });
  return Boolean(app);
}

export type ApplicationFull = Prisma.CandidateApplicationGetPayload<{
  include: {
    job: { select: { id: true; title: true } };
    candidate: { select: { id: true; fullName: true; email: true } };
    iacScore: true;
    interviews: true;
    hiringDecision: true;
  };
}>;
