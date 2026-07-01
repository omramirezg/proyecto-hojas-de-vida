'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from '../constants';
import type { ApplicationStatus } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? '…' : 'Actualizar'}
    </Button>
  );
}

export function ApplicationStatusSelect({
  action,
  applicationId,
  current,
}: {
  action: Action;
  applicationId: string;
  current: ApplicationStatus;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select name="status" defaultValue={current} className="h-9 w-40">
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <SubmitButton />
    </form>
  );
}
