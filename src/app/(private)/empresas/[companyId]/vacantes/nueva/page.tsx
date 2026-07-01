import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { createJobAction } from '@/features/jobs/actions';
import { JobForm } from '@/features/jobs/components/job-form';

export const metadata: Metadata = { title: 'Nueva vacante' };

export default async function NewJobPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();
  if (!hasPermission(membership.role, 'job:manage')) redirect(`/empresas/${companyId}/vacantes`);

  // Vincula el companyId a la Server Action (queda fuera del FormData del cliente).
  const action = createJobAction.bind(null, companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/vacantes`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a vacantes
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva vacante</h1>
        <p className="text-sm text-muted-foreground">
          Completa el análisis del cargo y define los criterios ponderados (deben sumar 100%).
        </p>
      </div>

      <JobForm action={action} submitLabel="Crear vacante" />
    </div>
  );
}
