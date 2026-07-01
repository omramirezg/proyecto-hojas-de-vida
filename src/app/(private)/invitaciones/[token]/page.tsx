import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getInvitationByToken } from '@/features/companies/repository';
import { ROLE_LABELS } from '@/lib/roles';
import { AcceptInvitationForm } from '@/features/companies/components/accept-invitation-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Invitación' };

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const invitation = await getInvitationByToken(token);

  const invalid = !invitation || invitation.status !== 'PENDING';
  const expired = invitation ? invitation.expiresAt < new Date() : false;
  const emailMismatch = invitation
    ? invitation.email.toLowerCase() !== session.user.email.toLowerCase()
    : false;

  const problem = invalid
    ? 'Esta invitación no es válida o ya fue utilizada.'
    : expired
      ? 'Esta invitación expiró. Pide a la empresa que te envíe una nueva.'
      : emailMismatch
        ? `Esta invitación es para ${invitation!.email}. Inicia sesión con ese correo para aceptarla.`
        : null;

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            {problem ? <AlertTriangle className="size-6" /> : <Building2 className="size-6" />}
          </div>
          <CardTitle>
            {problem ? 'No se puede aceptar' : `Invitación a ${invitation!.company.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {problem ? (
            <>
              <p className="text-sm text-muted-foreground">{problem}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/empresas">Ir a mis empresas</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Te uniras como{' '}
                <Badge variant="secondary">{ROLE_LABELS[invitation!.role]}</Badge>
              </p>
              <AcceptInvitationForm token={token} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
