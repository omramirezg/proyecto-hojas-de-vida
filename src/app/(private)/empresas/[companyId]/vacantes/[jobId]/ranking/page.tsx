import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Trophy, ChevronRight, ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getJob } from '@/features/jobs/repository';
import { getJobRanking } from '@/features/iac/repository';
import { IAC_CATEGORY_LABELS, IAC_CATEGORY_BADGE } from '@/features/iac/constants';
import { IacBreakdown } from '@/features/iac/components/iac-breakdown';
import { RecomputeRankingButton } from '@/features/iac/components/recompute-ranking-button';
import { recomputeRankingAction } from '@/features/iac/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Ranking' };

export default async function RankingPage({
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
  if (!hasPermission(membership.role, 'candidate:manage')) {
    redirect(`/empresas/${companyId}/vacantes/${jobId}`);
  }

  const job = await getJob(companyId, jobId);
  if (!job) notFound();

  const canManageJob = hasPermission(membership.role, 'job:manage');
  const rows = await getJobRanking(companyId, jobId);

  // Ordena por IAC (mayor a menor); sin IAC al final.
  const ranking = [...rows].sort(
    (a, b) => (b.iacScore?.overall ?? -1) - (a.iacScore?.overall ?? -1),
  );

  const recomputeAction = recomputeRankingAction.bind(null, companyId, jobId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/vacantes/${jobId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la vacante
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ranking inteligente</h1>
          <p className="text-sm text-muted-foreground">{job.title}</p>
        </div>
        {canManageJob ? <RecomputeRankingButton action={recomputeAction} /> : null}
      </div>

      <div className="flex items-center gap-2 rounded-lg border bg-accent/40 px-4 py-2.5 text-sm text-accent-foreground">
        <ShieldCheck className="size-4 shrink-0" />
        Reclutamiento ciego: la identidad está oculta. El IAC se calcula de forma determinista y
        sin datos sesgantes.
      </div>

      {ranking.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aún no hay candidatos postulados"
          description="Cuando postules candidatos a esta vacante y proceses sus CV, podrás calcular el ranking."
        />
      ) : (
        <ol className="space-y-3">
          {ranking.map((row, index) => {
            const score = row.iacScore;
            const code = row.candidate.id.slice(-4).toUpperCase();
            const hasResume = Boolean(row.candidate.standardizedResume);
            return (
              <li key={row.id}>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">Candidato {code}</CardTitle>
                        {score ? (
                          <Badge variant={IAC_CATEGORY_BADGE[score.category]} className="mt-1">
                            {IAC_CATEGORY_LABELS[score.category]}
                          </Badge>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {hasResume ? 'Sin IAC calculado' : 'CV no procesado'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold tabular-nums">{score?.overall ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">IAC / 100</div>
                    </div>
                  </CardHeader>

                  {score ? (
                    <CardContent className="space-y-4">
                      <p className="text-sm">{score.explanation}</p>

                      {score.strengths.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-success">
                            Fortalezas
                          </p>
                          <ul className="mt-1 list-inside list-disc text-sm">
                            {score.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {score.weaknesses.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-warning">
                            Debilidades
                          </p>
                          <ul className="mt-1 list-inside list-disc text-sm">
                            {score.weaknesses.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {score.risks.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                            Riesgos
                          </p>
                          <ul className="mt-1 list-inside list-disc text-sm">
                            {score.risks.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-primary">
                          Ver desglose por criterio
                        </summary>
                        <div className="mt-3">
                          <IacBreakdown
                            details={score.details.map((d) => ({
                              dimension: d.dimension,
                              weight: d.weight,
                              rawScore: d.rawScore,
                              applicable: d.applicable,
                              note: d.note,
                            }))}
                          />
                        </div>
                      </details>

                      <div className="flex justify-end">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/empresas/${companyId}/candidatos/${row.candidate.id}`}>
                            Ver perfil (revela identidad) <ChevronRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
