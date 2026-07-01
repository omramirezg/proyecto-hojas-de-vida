import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getJob } from '@/features/jobs/repository';
import { listEvaluations, listJobEvaluations } from '@/features/evaluations/repository';
import {
  assignEvaluationAction,
  unassignEvaluationAction,
  generateJobEvaluationAction,
} from '@/features/evaluations/actions';
import { AssignEvaluationForm } from '@/features/evaluations/components/assign-evaluation-form';
import { UnassignEvaluationButton } from '@/features/evaluations/components/unassign-evaluation-button';
import { GenerateEvaluationForm } from '@/features/evaluations/components/generate-evaluation-form';
import { EVALUATION_TYPE_LABELS, EVALUATION_TYPE_BADGE } from '@/features/evaluations/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Evaluaciones de la vacante' };

export default async function JobEvaluationsPage({
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
  if (!hasPermission(membership.role, 'evaluation:grade')) {
    redirect(`/empresas/${companyId}/vacantes/${jobId}`);
  }

  const job = await getJob(companyId, jobId);
  if (!job) notFound();

  const [catalog, assigned] = await Promise.all([
    listEvaluations(companyId),
    listJobEvaluations(companyId, jobId),
  ]);

  const assignedIds = new Set(assigned.map((a) => a.evaluationId));
  const available = catalog
    .filter((e) => !assignedIds.has(e.id))
    .map((e) => ({ id: e.id, title: e.title, type: e.type }));

  const assignAction = assignEvaluationAction.bind(null, companyId);
  const unassignAction = unassignEvaluationAction.bind(null, companyId);
  const generateAction = generateJobEvaluationAction.bind(null, companyId, jobId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/empresas/${companyId}/vacantes/${jobId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la vacante
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Evaluaciones de la vacante</h1>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </div>

      {/* Generar prueba con IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generar prueba con IA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea una prueba de opción múltiple alineada al análisis de este cargo. Podrás enviarla a
            los candidatos para que la respondan en línea y se califique sola.
          </p>
        </CardHeader>
        <CardContent>
          <GenerateEvaluationForm action={generateAction} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asignadas ({assigned.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assigned.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {assigned.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.evaluation.title}</span>
                    <Badge variant={EVALUATION_TYPE_BADGE[a.evaluation.type]}>
                      {EVALUATION_TYPE_LABELS[a.evaluation.type]}
                    </Badge>
                  </div>
                  <UnassignEvaluationButton
                    action={unassignAction}
                    jobId={jobId}
                    evaluationId={a.evaluationId}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay evaluaciones asignadas a esta vacante.
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Asignar evaluación</p>
            <AssignEvaluationForm action={assignAction} jobId={jobId} available={available} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
