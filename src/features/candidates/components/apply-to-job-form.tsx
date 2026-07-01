'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface JobOption {
  id: string;
  title: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Postulando…' : 'Postular'}
    </Button>
  );
}

export function ApplyToJobForm({
  action,
  candidateId,
  jobs,
}: {
  action: Action;
  candidateId: string;
  jobs: JobOption[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay vacantes disponibles para postular.</p>;
  }

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="candidateId" value={candidateId} />
      <div className="flex-1">
        <Select name="jobId" defaultValue="" required>
          <option value="" disabled>
            Selecciona una vacante…
          </option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </Select>
      </div>
      <SubmitButton />
    </form>
  );
}
