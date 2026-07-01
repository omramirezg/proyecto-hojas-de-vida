import { db } from '@/lib/db';
import { recordAudit } from '@/features/audit/service';
import { getCandidateEvaluationAverage } from '@/features/evaluations/repository';
import { computeIAC, type IacJobInput, type IacCandidateInput, type IacResult } from './engine';
import * as repo from './repository';

/** Reúne datos VISIBLES (nunca sesgantes) y ejecuta el motor determinista. */

async function loadApplication(companyId: string, applicationId: string) {
  return db.candidateApplication.findFirst({
    where: { id: applicationId, companyId },
    include: {
      job: { include: { criteria: true } },
      candidate: { include: { standardizedResume: true } },
    },
  });
}

export async function computeApplicationIac(
  companyId: string,
  applicationId: string,
  actorId: string,
): Promise<IacResult> {
  const app = await loadApplication(companyId, applicationId);
  if (!app) throw new Error('APPLICATION_NOT_FOUND');

  const resume = app.candidate.standardizedResume;
  if (!resume) throw new Error('IAC_NO_RESUME');

  const jobInput: IacJobInput = {
    criteria: app.job.criteria.map((c) => ({ dimension: c.dimension, weight: c.weight })),
    technicalSkills: app.job.technicalSkills,
    softSkills: app.job.softSkills,
    languages: app.job.languages,
    certifications: app.job.certifications,
    experienceYears: app.job.experienceYears,
    education: app.job.education,
    location: app.job.location,
    workMode: app.job.workMode,
  };

  const languages = Array.isArray(resume.languages)
    ? (resume.languages as { language: string; level?: string | null }[])
    : [];

  const evaluationScore = await getCandidateEvaluationAverage(companyId, app.candidateId);

  const candidateInput: IacCandidateInput = {
    technicalSkills: resume.technicalSkills,
    softSkills: resume.softSkills,
    languages,
    certifications: resume.certifications,
    yearsExperience: resume.yearsExperience,
    educationLevel: resume.educationLevel,
    degrees: resume.degrees,
    locationCity: resume.locationCity,
    locationCountry: resume.locationCountry,
    evaluationScore, // promedio de evaluaciones (Fase 7); null si no hay
  };

  const result = computeIAC(jobInput, candidateInput);

  await repo.saveIacScore({
    companyId,
    applicationId,
    candidateId: app.candidateId,
    jobId: app.jobId,
    result,
  });

  await recordAudit({
    action: 'iac.computed',
    actorId,
    companyId,
    entityType: 'IACScore',
    entityId: applicationId,
    metadata: { overall: result.overall, category: result.category, version: result.engineVersion },
  });

  return result;
}

export interface RecomputeSummary {
  total: number;
  computed: number;
  skipped: number;
}

/** Recalcula el IAC de TODAS las postulaciones de una vacante (las que tengan CV procesado). */
export async function recomputeJobIac(
  companyId: string,
  jobId: string,
  actorId: string,
): Promise<RecomputeSummary> {
  const apps = await db.candidateApplication.findMany({
    where: { companyId, jobId },
    select: { id: true, candidate: { select: { standardizedResume: { select: { id: true } } } } },
  });

  let computed = 0;
  let skipped = 0;
  for (const a of apps) {
    if (!a.candidate.standardizedResume) {
      skipped += 1;
      continue;
    }
    await computeApplicationIac(companyId, a.id, actorId);
    computed += 1;
  }

  return { total: apps.length, computed, skipped };
}
