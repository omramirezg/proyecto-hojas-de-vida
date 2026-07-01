import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { createEvaluationAction } from '@/features/evaluations/actions';
import { EvaluationForm } from '@/features/evaluations/components/evaluation-form';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Nueva evaluación' };

export default async function NewEvaluationPage({
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
  if (!hasPermission(membership.role, 'evaluation:grade')) {
    redirect(`/empresas/${companyId}/evaluaciones`);
  }

  const action = createEvaluationAction.bind(null, companyId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/empresas/${companyId}/evaluaciones`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a evaluaciones
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva evaluación</h1>
        <p className="text-sm text-muted-foreground">
          Define una prueba técnica o blanda. Luego podrás asignarla a vacantes y registrar
          resultados.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EvaluationForm action={action} />
        </CardContent>
      </Card>
    </div>
  );
}
