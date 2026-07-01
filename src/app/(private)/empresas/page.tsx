import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Plus, Users } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getUserCompanies } from '@/features/companies/repository';
import { countryName } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Empresas' };

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const companies = await getUserCompanies(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Gestiona las empresas a las que perteneces.</p>
        </div>
        <Button asChild>
          <Link href="/empresas/nueva">
            <Plus className="size-4" /> Nueva empresa
          </Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aún no tienes una empresa"
          description="Crea tu primera empresa para configurar su perfil, invitar a tu equipo y empezar a publicar vacantes."
          action={
            <Button asChild>
              <Link href="/empresas/nueva">
                <Plus className="size-4" /> Crear empresa
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <Link key={company.id} href={`/empresas/${company.id}`} className="group">
              <Card className="transition-colors group-hover:border-primary">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{company.name}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {[company.sector, countryName(company.country)].filter(Boolean).join(' · ') ||
                        'Sin configurar'}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Users className="mr-1 size-3" />
                    {company._count.members} miembro(s)
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
