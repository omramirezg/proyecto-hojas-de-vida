import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getCompanyById } from '@/features/companies/repository';
import { updateCompanyAction } from '@/features/companies/actions';
import { CompanyForm } from '@/features/companies/components/company-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Editar empresa' };

export default async function EditCompanyPage({
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
  if (!hasPermission(membership.role, 'company:manage')) {
    redirect(`/empresas/${companyId}`);
  }

  const company = await getCompanyById(companyId);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/empresas/${companyId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver al perfil
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm
            action={updateCompanyAction}
            submitLabel="Guardar cambios"
            defaults={{
              id: company.id,
              name: company.name,
              sector: company.sector,
              size: company.size,
              country: company.country,
              website: company.website,
              logoUrl: company.logoUrl,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
