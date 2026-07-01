import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Users, Plus, FileText, Briefcase } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { listCandidates } from '@/features/candidates/repository';
import { CANDIDATE_SOURCE_LABELS } from '@/features/candidates/constants';
import { getInitials } from '@/lib/utils';
import { processPendingResumesAction } from '@/features/resumes/actions';
import { ProcessPendingButton } from '@/features/resumes/components/process-pending-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Candidatos' };

export default async function CandidatesPage({
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

  const canManage = hasPermission(membership.role, 'candidate:manage');
  const candidates = await listCandidates(companyId);

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
          <h1 className="text-2xl font-bold tracking-tight">Candidatos</h1>
          <p className="text-sm text-muted-foreground">Personas candidatas registradas en la empresa.</p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <ProcessPendingButton action={processPendingResumesAction.bind(null, companyId)} />
            <Button asChild>
              <Link href={`/empresas/${companyId}/candidatos/nuevo`}>
                <Plus className="size-4" /> Nuevo candidato
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aún no hay candidatos"
          description="Registra candidatos manualmente o cargando su hoja de vida, y asócialos a tus vacantes."
          action={
            canManage ? (
              <Button asChild>
                <Link href={`/empresas/${companyId}/candidatos/nuevo`}>
                  <Plus className="size-4" /> Registrar candidato
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <Link key={c.id} href={`/empresas/${companyId}/candidatos/${c.id}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                      {getInitials(c.fullName.split(' ')[0], c.fullName.split(' ')[1])}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.email ?? CANDIDATE_SOURCE_LABELS[c.source]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Briefcase className="mr-1 size-3" />
                      {c._count.applications}
                    </Badge>
                    <Badge variant="secondary">
                      <FileText className="mr-1 size-3" />
                      {c._count.resumeFiles}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
