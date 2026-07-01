import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil, Trophy, ClipboardCheck } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getJob } from '@/features/jobs/repository';
import {
  CRITERIA_DIMENSIONS,
  JOB_STATUS_LABELS,
  JOB_STATUS_BADGE,
  WORK_MODE_LABELS,
} from '@/features/jobs/constants';
import { JobStatusActions } from '@/features/jobs/components/job-status-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Vacante' };

export default async function JobDetailPage({
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

  const job = await getJob(companyId, jobId);
  if (!job) notFound();

  const canManage = hasPermission(membership.role, 'job:manage');
  const canViewRanking = hasPermission(membership.role, 'candidate:manage');
  const canGrade = hasPermission(membership.role, 'evaluation:grade');
  const weightByDimension = new Map(job.criteria.map((c) => [c.dimension, c.weight]));

  const salary =
    job.salaryMin || job.salaryMax
      ? `${job.salaryMin ?? '—'} – ${job.salaryMax ?? '—'} ${job.salaryCurrency ?? ''}`.trim()
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/vacantes`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a vacantes
      </Link>

      {/* Encabezado + estado */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={JOB_STATUS_BADGE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
            </div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                job.location,
                job.workMode ? WORK_MODE_LABELS[job.workMode] : null,
                job.experienceYears ? `${job.experienceYears}+ años` : null,
                salary,
              ]
                .filter(Boolean)
                .join(' · ') || 'Sin condiciones definidas'}
            </p>
          </div>
          <div className="flex gap-2">
            {canViewRanking ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/empresas/${companyId}/vacantes/${job.id}/ranking`}>
                  <Trophy className="size-4" /> Ranking
                </Link>
              </Button>
            ) : null}
            {canGrade ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/empresas/${companyId}/vacantes/${job.id}/evaluaciones`}>
                  <ClipboardCheck className="size-4" /> Evaluaciones
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/empresas/${companyId}/vacantes/${job.id}/editar`}>
                  <Pencil className="size-4" /> Editar
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {canManage ? (
          <CardContent>
            <JobStatusActions companyId={companyId} jobId={job.id} status={job.status} />
          </CardContent>
        ) : null}
      </Card>

      {/* Análisis del cargo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análisis del cargo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Objetivo" value={job.objective} />
          <ListBlock label="Funciones" items={job.functions} />
          <ListBlock label="Responsabilidades" items={job.responsibilities} />
          <Field label="Formación requerida" value={job.education} />
          <Field label="Experiencia requerida" value={job.experience} />
          <TagBlock label="Habilidades técnicas" items={job.technicalSkills} />
          <TagBlock label="Habilidades blandas" items={job.softSkills} />
          <TagBlock label="Idiomas" items={job.languages} />
          <TagBlock label="Certificaciones" items={job.certifications} />
        </CardContent>
      </Card>

      {/* Criterios ponderados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criterios ponderados (IAC)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {CRITERIA_DIMENSIONS.map((d) => {
              const weight = weightByDimension.get(d.dimension) ?? 0;
              return (
                <li key={d.dimension} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-sm">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${weight}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm font-medium">{weight}%</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm">{value}</p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TagBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
