import { db } from '@/lib/db';
import type { ApplicationStatus } from '@prisma/client';

/** Agregaciones de solo lectura para el dashboard de una empresa (tenant). */

export interface JobOverview {
  id: string;
  title: string;
  status: string;
  applicants: number;
  topIac: number | null;
}

export interface CompanyMetrics {
  activeJobs: number;
  totalJobs: number;
  totalCandidates: number;
  totalApplications: number;
  interviews: number;
  hired: number;
  statusCounts: Record<ApplicationStatus, number>;
  jobsOverview: JobOverview[];
}

const EMPTY_STATUS_COUNTS: Record<ApplicationStatus, number> = {
  APPLIED: 0,
  SCREENING: 0,
  INTERVIEW: 0,
  OFFER: 0,
  HIRED: 0,
  REJECTED: 0,
  WITHDRAWN: 0,
};

export async function getCompanyMetrics(companyId: string): Promise<CompanyMetrics> {
  const [activeJobs, totalJobs, totalCandidates, totalApplications, statusGroups, jobs, iacMax] =
    await Promise.all([
      db.job.count({ where: { companyId, deletedAt: null, status: 'PUBLISHED' } }),
      db.job.count({ where: { companyId, deletedAt: null } }),
      db.candidate.count({ where: { companyId, deletedAt: null } }),
      db.candidateApplication.count({ where: { companyId } }),
      db.candidateApplication.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      db.job.findMany({
        where: { companyId, deletedAt: null },
        include: { _count: { select: { applications: true } } },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        take: 8,
      }),
      db.iACScore.groupBy({
        by: ['jobId'],
        where: { companyId },
        _max: { overall: true },
      }),
    ]);

  const statusCounts = { ...EMPTY_STATUS_COUNTS };
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count._all;
  }

  const topIacByJob = new Map(iacMax.map((r) => [r.jobId, r._max.overall ?? null]));

  const jobsOverview: JobOverview[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    applicants: j._count.applications,
    topIac: topIacByJob.get(j.id) ?? null,
  }));

  return {
    activeJobs,
    totalJobs,
    totalCandidates,
    totalApplications,
    interviews: statusCounts.INTERVIEW,
    hired: statusCounts.HIRED,
    statusCounts,
    jobsOverview,
  };
}
