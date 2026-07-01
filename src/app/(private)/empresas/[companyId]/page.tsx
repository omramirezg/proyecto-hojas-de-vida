import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Building2, Pencil, Users, Mail, Briefcase, UserSearch, ClipboardCheck } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission, ROLE_LABELS } from '@/lib/roles';
import { countryName, COMPANY_SIZES } from '@/lib/constants';
import {
  getCompanyById,
  listMembers,
  listPendingInvitations,
} from '@/features/companies/repository';
import { getInitials } from '@/lib/utils';
import { InviteMemberForm } from '@/features/companies/components/invite-member-form';
import { InvitationsPanel } from '@/features/companies/components/invitations-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Perfil de empresa' };

export default async function CompanyDetailPage({
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

  const company = await getCompanyById(companyId);
  if (!company) notFound();

  const canManage = hasPermission(membership.role, 'company:manage');
  const canInvite = hasPermission(membership.role, 'member:invite');

  const [members, invitations] = await Promise.all([
    listMembers(companyId),
    canInvite ? listPendingInvitations(companyId) : Promise.resolve([]),
  ]);

  const sizeLabel = COMPANY_SIZES.find((s) => s.value === company.size)?.label;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="size-7" />
            </div>
            <div>
              <CardTitle className="text-xl">{company.name}</CardTitle>
              <div className="mt-1 flex flex-wrap gap-2">
                {company.sector ? <Badge variant="secondary">{company.sector}</Badge> : null}
                {sizeLabel ? <Badge variant="outline">{sizeLabel}</Badge> : null}
                {company.country ? (
                  <Badge variant="outline">{countryName(company.country)}</Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/empresas/${company.id}/vacantes`}>
                <Briefcase className="size-4" /> Vacantes
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/empresas/${company.id}/candidatos`}>
                <UserSearch className="size-4" /> Candidatos
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/empresas/${company.id}/evaluaciones`}>
                <ClipboardCheck className="size-4" /> Evaluaciones
              </Link>
            </Button>
            {canManage ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/empresas/${company.id}/editar`}>
                  <Pencil className="size-4" /> Editar
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        {company.website ? (
          <CardContent>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {company.website}
            </a>
          </CardContent>
        ) : null}
      </Card>

      {/* Miembros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" /> Miembros del equipo ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border">
            {members.map((m) => {
              const name =
                [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') ||
                m.user.email.split('@')[0];
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                      {getInitials(m.user.firstName, m.user.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </div>
                  </div>
                  <Badge variant={m.role === 'COMPANY_ADMIN' ? 'default' : 'secondary'}>
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Invitaciones (solo quien puede invitar) */}
      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" /> Invitar miembros
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Crea una invitación y comparte el enlace. La persona deberá iniciar sesión con el
              correo invitado para unirse.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <InviteMemberForm companyId={company.id} />
            <div>
              <h3 className="mb-2 text-sm font-medium">Invitaciones pendientes</h3>
              <InvitationsPanel
                companyId={company.id}
                invitations={invitations.map((i) => ({
                  id: i.id,
                  email: i.email,
                  role: i.role,
                  token: i.token,
                  expiresAt: i.expiresAt.toISOString(),
                }))}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
