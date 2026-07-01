import { db } from '@/lib/db';
import type { JobBodyInput, CriteriaInput } from './schemas';
import type { JobStatus, Prisma } from '@prisma/client';

/** Acceso a datos de vacantes. Toda query exige el companyId (tenant). */

function toJobData(body: JobBodyInput) {
  return {
    title: body.title,
    objective: body.objective ?? null,
    functions: body.functions,
    responsibilities: body.responsibilities,
    education: body.education ?? null,
    experience: body.experience ?? null,
    experienceYears: body.experienceYears ?? null,
    technicalSkills: body.technicalSkills,
    softSkills: body.softSkills,
    languages: body.languages,
    certifications: body.certifications,
    location: body.location ?? null,
    workMode: body.workMode ?? null,
    salaryMin: body.salaryMin ?? null,
    salaryMax: body.salaryMax ?? null,
    salaryCurrency: body.salaryCurrency ?? null,
  } satisfies Prisma.JobUncheckedUpdateInput;
}

export async function createJob(companyId: string, body: JobBodyInput, criteria: CriteriaInput) {
  return db.job.create({
    data: {
      companyId,
      ...toJobData(body),
      criteria: {
        create: criteria.map((c) => ({ dimension: c.dimension, weight: c.weight })),
      },
    },
    include: { criteria: true },
  });
}

export async function updateJob(
  companyId: string,
  jobId: string,
  body: JobBodyInput,
  criteria: CriteriaInput,
) {
  // Reemplaza criterios de forma atómica (borra y recrea).
  return db.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id: jobId, companyId },
      data: toJobData(body),
    });
    await tx.jobCriteria.deleteMany({ where: { jobId } });
    await tx.jobCriteria.createMany({
      data: criteria.map((c) => ({ jobId, dimension: c.dimension, weight: c.weight })),
    });
    return job;
  });
}

export async function listJobs(companyId: string) {
  return db.job.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });
}

export async function getJob(companyId: string, jobId: string) {
  return db.job.findFirst({
    where: { id: jobId, companyId, deletedAt: null },
    include: { criteria: { orderBy: { weight: 'desc' } } },
  });
}

export async function changeJobStatus(companyId: string, jobId: string, status: JobStatus) {
  return db.job.updateMany({
    where: { id: jobId, companyId, deletedAt: null },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  });
}

export type JobWithCriteria = Prisma.JobGetPayload<{ include: { criteria: true } }>;
