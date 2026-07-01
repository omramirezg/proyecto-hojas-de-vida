import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getJob } from '@/features/jobs/repository';
import { updateJobAction } from '@/features/jobs/actions';
import { JobForm } from '@/features/jobs/components/job-form';
import type { CriteriaDimension } from '@prisma/client';

export const metadata: Metadata = { title: 'Editar vacante' };

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ companyId: string; jobId: string }>;
}) {
  const { companyId, jobId } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();
  if (!hasPermission(membership.role, 'job:manage')) {
    redirect(`/empresas/${companyId}/vacantes/${jobId}`);
  }

  const job = await getJob(companyId, jobId);
  if (!job) notFound();

  const weights = Object.fromEntries(
    job.criteria.map((c) => [c.dimension, c.weight]),
  ) as Partial<Record<CriteriaDimension, number>>;

  const action = updateJobAction.bind(null, companyId, jobId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/vacantes/${jobId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la vacante
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Editar vacante</h1>

      <JobForm
        action={action}
        submitLabel="Guardar cambios"
        defaults={{
          title: job.title,
          objective: job.objective,
          functions: job.functions,
          responsibilities: job.responsibilities,
          education: job.education,
          experience: job.experience,
          experienceYears: job.experienceYears,
          technicalSkills: job.technicalSkills,
          softSkills: job.softSkills,
          languages: job.languages,
          certifications: job.certifications,
          location: job.location,
          workMode: job.workMode,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          weights,
        }}
      />
    </div>
  );
}
