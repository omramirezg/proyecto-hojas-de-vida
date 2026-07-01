'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Send, Lock, Archive, RotateCcw } from 'lucide-react';
import { initialActionState } from '@/lib/action-state';
import { changeJobStatusAction } from '../actions';
import { Button } from '@/components/ui/button';
import type { JobStatus } from '@prisma/client';

type Variant = 'default' | 'outline' | 'secondary';

function StatusButton({
  companyId,
  jobId,
  status,
  label,
  icon: Icon,
  variant = 'outline',
}: {
  companyId: string;
  jobId: string;
  status: JobStatus;
  label: string;
  icon: typeof Send;
  variant?: Variant;
}) {
  const [state, formAction] = useActionState(changeJobStatusAction, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="status" value={status} />
      <Pending label={label} icon={Icon} variant={variant} />
    </form>
  );
}

function Pending({
  label,
  icon: Icon,
  variant,
}: {
  label: string;
  icon: typeof Send;
  variant: Variant;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      <Icon className="size-4" /> {label}
    </Button>
  );
}

export function JobStatusActions({
  companyId,
  jobId,
  status,
}: {
  companyId: string;
  jobId: string;
  status: JobStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'DRAFT' ? (
        <StatusButton
          companyId={companyId}
          jobId={jobId}
          status="PUBLISHED"
          label="Publicar"
          icon={Send}
          variant="default"
        />
      ) : null}
      {status === 'PUBLISHED' ? (
        <StatusButton companyId={companyId} jobId={jobId} status="CLOSED" label="Cerrar" icon={Lock} />
      ) : null}
      {status === 'CLOSED' ? (
        <>
          <StatusButton
            companyId={companyId}
            jobId={jobId}
            status="PUBLISHED"
            label="Reabrir"
            icon={RotateCcw}
          />
          <StatusButton
            companyId={companyId}
            jobId={jobId}
            status="ARCHIVED"
            label="Archivar"
            icon={Archive}
          />
        </>
      ) : null}
      {status === 'ARCHIVED' ? (
        <StatusButton
          companyId={companyId}
          jobId={jobId}
          status="DRAFT"
          label="Restaurar"
          icon={RotateCcw}
        />
      ) : null}
    </div>
  );
}
