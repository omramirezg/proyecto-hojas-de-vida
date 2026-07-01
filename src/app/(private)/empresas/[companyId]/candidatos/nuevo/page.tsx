import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { createCandidateAction } from '@/features/candidates/actions';
import { listSelectableJobs } from '@/features/candidates/repository';
import { CandidateForm } from '@/features/candidates/components/candidate-form';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Nuevo candidato' };

export default async function NewCandidatePage({
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
  if (!hasPermission(membership.role, 'candidate:manage')) {
    redirect(`/empresas/${companyId}/candidatos`);
  }

  const jobs = await listSelectableJobs(companyId);
  const action = createCandidateAction.bind(null, companyId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/empresas/${companyId}/candidatos`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a candidatos
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo candidato</h1>
        <p className="text-sm text-muted-foreground">
          Registra la persona candidata y, opcionalmente, carga su CV y postúlala a una vacante.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CandidateForm action={action} jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />
        </CardContent>
      </Card>
    </div>
  );
}
