import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createCompanyAction } from '@/features/companies/actions';
import { CompanyForm } from '@/features/companies/components/company-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Nueva empresa' };

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/empresas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a empresas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Crear empresa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Serás el administrador de esta empresa. Podrás invitar a tu equipo después.
          </p>
        </CardHeader>
        <CardContent>
          <CompanyForm action={createCompanyAction} submitLabel="Crear empresa" />
        </CardContent>
      </Card>
    </div>
  );
}
