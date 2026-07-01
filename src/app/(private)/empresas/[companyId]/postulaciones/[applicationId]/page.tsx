import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, Gauge, ClipboardList, MapPin } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getApplicationFull } from '@/features/interviews/repository';
import { getCandidateEvaluationAverage } from '@/features/evaluations/repository';
import {
  scheduleInterviewAction,
  updateInterviewAction,
  decideHiringAction,
} from '@/features/interviews/actions';
import { ScheduleInterviewForm } from '@/features/interviews/components/schedule-interview-form';
import { InterviewStatusForm } from '@/features/interviews/components/interview-status-form';
import { HiringDecisionForm } from '@/features/interviews/components/hiring-decision-form';
import {
  INTERVIEW_MODE_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_BADGE,
  HIRING_OUTCOME_LABELS,
  HIRING_OUTCOME_BADGE,
} from '@/features/interviews/constants';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_BADGE } from '@/features/candidates/constants';
import { IAC_CATEGORY_LABELS, IAC_CATEGORY_BADGE } from '@/features/iac/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Proceso' };

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ companyId: string; applicationId: string }>;
}) {
  const { companyId, applicationId } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();
  if (!hasPermission(membership.role, 'candidate:manage')) {
    redirect(`/empresas/${companyId}`);
  }

  const app = await getApplicationFull(companyId, applicationId);
  if (!app) notFound();

  const evaluationAvg = await getCandidateEvaluationAverage(companyId, app.candidate.id);

  const scheduleAction = scheduleInterviewAction.bind(null, companyId, applicationId);
  const updateAction = updateInterviewAction.bind(null, companyId, applicationId);
  const decideAction = decideHiringAction.bind(null, companyId, applicationId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/candidatos/${app.candidate.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver al candidato
      </Link>

      {/* Encabezado */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{app.candidate.fullName}</CardTitle>
            <Badge variant={APPLICATION_STATUS_BADGE[app.status]}>
              {APPLICATION_STATUS_LABELS[app.status]}
            </Badge>
            {app.hiringDecision ? (
              <Badge variant={HIRING_OUTCOME_BADGE[app.hiringDecision.decision]}>
                {HIRING_OUTCOME_LABELS[app.hiringDecision.decision]}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Vacante:{' '}
            <Link href={`/empresas/${companyId}/vacantes/${app.job.id}`} className="hover:underline">
              {app.job.title}
            </Link>
          </p>
        </CardHeader>
      </Card>

      {/* Resumen del proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" /> Resumen del proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Summary
              icon={Gauge}
              label="IAC"
              value={app.iacScore ? `${app.iacScore.overall}/100` : '—'}
              sub={app.iacScore ? IAC_CATEGORY_LABELS[app.iacScore.category] : 'Sin calcular'}
              badge={
                app.iacScore ? (
                  <Badge variant={IAC_CATEGORY_BADGE[app.iacScore.category]}>
                    {IAC_CATEGORY_LABELS[app.iacScore.category]}
                  </Badge>
                ) : null
              }
            />
            <Summary
              icon={ClipboardList}
              label="Evaluaciones"
              value={evaluationAvg != null ? `${evaluationAvg}/100` : '—'}
              sub={evaluationAvg != null ? 'Promedio' : 'Sin resultados'}
            />
            <Summary
              icon={CalendarDays}
              label="Entrevistas"
              value={`${app.interviews.length}`}
              sub={`${app.interviews.filter((i) => i.status === 'COMPLETED').length} realizada(s)`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Decisión de contratación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decisión de contratación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {app.hiringDecision ? (
            <div className="rounded-lg border bg-secondary/40 p-3 text-sm">
              <Badge variant={HIRING_OUTCOME_BADGE[app.hiringDecision.decision]}>
                {HIRING_OUTCOME_LABELS[app.hiringDecision.decision]}
              </Badge>
              {app.hiringDecision.reason ? (
                <p className="mt-2 whitespace-pre-line">{app.hiringDecision.reason}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">Puedes actualizar la decisión abajo.</p>
            </div>
          ) : null}
          <HiringDecisionForm action={decideAction} />
        </CardContent>
      </Card>

      {/* Entrevistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" /> Entrevistas ({app.interviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {app.interviews.length > 0 ? (
            <ul className="space-y-3">
              {app.interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      {new Date(iv.scheduledAt).toLocaleString('es', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{INTERVIEW_MODE_LABELS[iv.mode]}</Badge>
                      <Badge variant={INTERVIEW_STATUS_BADGE[iv.status]}>
                        {INTERVIEW_STATUS_LABELS[iv.status]}
                      </Badge>
                    </div>
                  </div>
                  {iv.location ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {iv.location}
                    </p>
                  ) : null}
                  <InterviewStatusForm
                    action={updateAction}
                    interviewId={iv.id}
                    status={iv.status}
                    notes={iv.notes}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay entrevistas programadas.</p>
          )}

          <div className="border-t pt-5">
            <p className="mb-3 text-sm font-medium">Programar nueva entrevista</p>
            <ScheduleInterviewForm action={scheduleAction} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  sub,
  badge,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  sub: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {badge ?? <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
