import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Plus } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { listEvaluations } from '@/features/evaluations/repository';
import { EVALUATION_TYPE_LABELS, EVALUATION_TYPE_BADGE } from '@/features/evaluations/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Evaluaciones' };

export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();

  const canGrade = hasPermission(membership.role, 'evaluation:grade');
  const evaluations = await listEvaluations(companyId);

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
          <h1 className="text-2xl font-bold tracking-tight">Evaluaciones</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de pruebas técnicas y blandas de la empresa.
          </p>
        </div>
        {canGrade ? (
          <Button asChild>
            <Link href={`/empresas/${companyId}/evaluaciones/nueva`}>
              <Plus className="size-4" /> Nueva evaluación
            </Link>
          </Button>
        ) : null}
      </div>

      {evaluations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aún no hay evaluaciones"
          description="Crea pruebas técnicas o blandas, asígnalas a tus vacantes y registra los resultados de los candidatos."
          action={
            canGrade ? (
              <Button asChild>
                <Link href={`/empresas/${companyId}/evaluaciones/nueva`}>
                  <Plus className="size-4" /> Crear evaluación
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {evaluations.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{e.title}</p>
                    <Badge variant={EVALUATION_TYPE_BADGE[e.type]}>
                      {EVALUATION_TYPE_LABELS[e.type]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Máx {e.maxScore} · {e._count.jobLinks} vacante(s) · {e._count.results} resultado(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
