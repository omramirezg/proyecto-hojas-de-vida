'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INTERVIEW_STATUSES, INTERVIEW_STATUS_LABELS } from '../constants';
import type { InterviewStatus } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}

export function InterviewStatusForm({
  action,
  interviewId,
  status,
  notes,
}: {
  action: Action;
  interviewId: string;
  status: InterviewStatus;
  notes: string | null;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="interviewId" value={interviewId} />
      <div className="flex items-center gap-2">
        <Select name="status" defaultValue={status} className="h-9 w-44">
          {INTERVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INTERVIEW_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <SubmitButton />
      </div>
      <Textarea
        name="notes"
        defaultValue={notes ?? ''}
        placeholder="Observaciones de la entrevista…"
        className="min-h-16"
      />
    </form>
  );
}
