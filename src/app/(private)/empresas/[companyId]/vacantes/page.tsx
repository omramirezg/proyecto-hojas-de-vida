import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Briefcase, Plus } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { listJobs } from '@/features/jobs/repository';
import { JOB_STATUS_LABELS, JOB_STATUS_BADGE, WORK_MODE_LABELS } from '@/features/jobs/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Vacantes' };

export default async function JobsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();

  const canManage = hasPermission(membership.role, 'job:manage');
  const jobs = await listJobs(companyId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/empresas/${companyId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la empresa
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vacantes</h1>
          <p className="text-sm text-muted-foreground">Crea y gestiona las vacantes de la empresa.</p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href={`/empresas/${companyId}/vacantes/nueva`}>
              <Plus className="size-4" /> Nueva vacante
            </Link>
          </Button>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aún no hay vacantes"
          description="Crea una vacante con su análisis de cargo y criterios ponderados para empezar a recibir candidatos."
          action={
            canManage ? (
              <Button asChild>
                <Link href={`/empresas/${companyId}/vacantes/nueva`}>
                  <Plus className="size-4" /> Crear vacante
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/empresas/${companyId}/vacantes/${job.id}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        job.location,
                        job.workMode ? WORK_MODE_LABELS[job.workMode] : null,
                        job.experienceYears ? `${job.experienceYears}+ años` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <Badge variant={JOB_STATUS_BADGE[job.status]}>
                    {JOB_STATUS_LABELS[job.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
