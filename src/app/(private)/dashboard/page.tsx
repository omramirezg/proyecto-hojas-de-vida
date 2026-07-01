import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getCompanyMetrics } from '@/features/dashboard/service';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_BADGE } from '@/features/candidates/constants';
import { JOB_STATUS_LABELS, JOB_STATUS_BADGE } from '@/features/jobs/constants';
import { APPLICATION_STATUSES } from '@/features/candidates/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Briefcase, Users, CalendarDays, Trophy, Building2, Plus } from 'lucide-react';
import type { JobStatus } from '@prisma/client';

export const metadata: Metadata = { title: 'Panel' };

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user.firstName ?? 'de nuevo';
  const activeMembership = session?.memberships[0];

  if (!activeMembership) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <Header firstName={firstName} />
        <EmptyState
          icon={Building2}
          title="Aún no tienes una empresa"
          description="Crea tu empresa para configurar su perfil, publicar vacantes y empezar a recibir candidatos."
          action={
            <Button asChild>
              <Link href="/empresas/nueva">
                <Plus className="size-4" /> Crear empresa
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const companyId = activeMembership.companyId;
  const metrics = await getCompanyMetrics(companyId);

  const kpis = [
    { label: 'Vacantes activas', value: metrics.activeJobs, icon: Briefcase },
    { label: 'Candidatos', value: metrics.totalCandidates, icon: Users },
    { label: 'Entrevistas', value: metrics.interviews, icon: CalendarDays },
    { label: 'Contrataciones', value: metrics.hired, icon: Trophy },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <Header firstName={firstName} companyName={activeMembership.company.name} />
        <Button asChild variant="outline">
          <Link href={`/empresas/${companyId}`}>Ver empresa</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estado de procesos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de procesos</CardTitle>
          <p className="text-sm text-muted-foreground">
            {metrics.totalApplications} postulación(es) en total.
          </p>
        </CardHeader>
        <CardContent>
          {metrics.totalApplications === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay postulaciones. Crea vacantes y registra candidatos para verlas aquí.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Badge variant={APPLICATION_STATUS_BADGE[s]}>{APPLICATION_STATUS_LABELS[s]}</Badge>
                  <span className="font-semibold tabular-nums">{metrics.statusCounts[s]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking por vacante */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Vacantes y mejor IAC</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/empresas/${companyId}/vacantes`}>Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {metrics.jobsOverview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay vacantes todavía.{' '}
              <Link href={`/empresas/${companyId}/vacantes/nueva`} className="text-primary hover:underline">
                Crear la primera
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {metrics.jobsOverview.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <Link
                      href={`/empresas/${companyId}/vacantes/${job.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={JOB_STATUS_BADGE[job.status as JobStatus]}>
                        {JOB_STATUS_LABELS[job.status as JobStatus]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {job.applicants} candidato(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.topIac != null ? (
                      <div className="text-right">
                        <div className="text-lg font-bold tabular-nums">{job.topIac}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">mejor IAC</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin IAC</span>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/empresas/${companyId}/vacantes/${job.id}/ranking`}>
                        <Trophy className="size-4" /> Ranking
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ firstName, companyName }: { firstName: string; companyName?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Hola, {firstName} 👋</h1>
      <p className="text-sm text-muted-foreground">
        {companyName ? `Panel de ${companyName}.` : 'Bienvenido a tu panel.'}
      </p>
    </div>
  );
}
