'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/roles';
import { revokeInvitationAction } from '../actions';
import { initialActionState } from '@/lib/action-state';
import { useActionState } from 'react';
import type { CompanyRole } from '@prisma/client';

export interface PendingInvitation {
  id: string;
  email: string;
  role: CompanyRole;
  token: string;
  expiresAt: string; // ISO
}

export function InvitationsPanel({
  companyId,
  invitations,
}: {
  companyId: string;
  invitations: PendingInvitation[];
}) {
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay invitaciones pendientes.</p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {invitations.map((inv) => (
        <InvitationItem key={inv.id} companyId={companyId} invitation={inv} />
      ))}
    </ul>
  );
}

function InvitationItem({
  companyId,
  invitation,
}: {
  companyId: string;
  invitation: PendingInvitation;
}) {
  const [copied, setCopied] = useState(false);
  const [, revokeAction, revoking] = useActionState(revokeInvitationAction, initialActionState);

  async function copyLink() {
    const url = `${window.location.origin}/invitaciones/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          Expira el {new Date(invitation.expiresAt).toLocaleDateString('es')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{ROLE_LABELS[invitation.role]}</Badge>
        <Button type="button" variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          Enlace
        </Button>
        <form action={revokeAction}>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="invitationId" value={invitation.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={revoking}>
            <X className="size-4" />
            Revocar
          </Button>
        </form>
      </div>
    </li>
  );
}
