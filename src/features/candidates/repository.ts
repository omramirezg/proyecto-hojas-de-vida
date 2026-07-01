import { db } from '@/lib/db';
import type { CandidateCreateInput } from './schemas';
import type { ApplicationStatus, CandidateSource, Prisma, ResumeStatus } from '@prisma/client';

/** Acceso a datos de candidatos, postulaciones y archivos de CV. Siempre por tenant. */

export async function createCandidate(
  companyId: string,
  data: CandidateCreateInput,
  source: CandidateSource,
) {
  return db.candidate.create({
    data: {
      companyId,
      fullName: data.fullName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      source,
    },
  });
}

export async function listCandidates(companyId: string) {
  return db.candidate.findMany({
    where: { companyId, deletedAt: null },
    include: {
      _count: { select: { applications: true, resumeFiles: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCandidate(companyId: string, candidateId: string) {
  return db.candidate.findFirst({
    where: { id: candidateId, companyId, deletedAt: null },
    include: {
      resumeFiles: { orderBy: { createdAt: 'desc' } },
      applications: {
        include: { job: true, iacScore: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function applyToJob(params: {
  companyId: string;
  candidateId: string;
  jobId: string;
}) {
  // Idempotente: si ya está postulado a esa vacante, no duplica.
  return db.candidateApplication.upsert({
    where: { candidateId_jobId: { candidateId: params.candidateId, jobId: params.jobId } },
    update: {},
    create: {
      companyId: params.companyId,
      candidateId: params.candidateId,
      jobId: params.jobId,
      status: 'APPLIED',
    },
  });
}

export async function changeApplicationStatus(
  companyId: string,
  applicationId: string,
  status: ApplicationStatus,
) {
  return db.candidateApplication.updateMany({
    where: { id: applicationId, companyId },
    data: { status },
  });
}

export async function createResumeFile(params: {
  companyId: string;
  candidateId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status?: ResumeStatus;
}) {
  return db.resumeFile.create({
    data: {
      companyId: params.companyId,
      candidateId: params.candidateId,
      fileName: params.fileName,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      status: params.status ?? 'UPLOADED',
    },
  });
}

export async function getResumeFile(companyId: string, resumeId: string) {
  return db.resumeFile.findFirst({ where: { id: resumeId, companyId } });
}

/** Verifica que la vacante exista en la empresa (para asociar candidatos). */
export async function jobBelongsToCompany(companyId: string, jobId: string): Promise<boolean> {
  const job = await db.job.findFirst({
    where: { id: jobId, companyId, deletedAt: null },
    select: { id: true },
  });
  return Boolean(job);
}

/** Vacantes publicadas/abiertas para los selectores de postulación. */
export async function listSelectableJobs(companyId: string) {
  return db.job.findMany({
    where: { companyId, deletedAt: null, status: { in: ['PUBLISHED', 'DRAFT'] } },
    select: { id: true, title: true, status: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export type CandidateWithRelations = Prisma.CandidateGetPayload<{
  include: {
    resumeFiles: true;
    applications: { include: { job: true } };
  };
}>;
