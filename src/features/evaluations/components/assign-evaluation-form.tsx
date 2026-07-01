'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { EVALUATION_TYPE_LABELS } from '../constants';
import type { EvaluationType } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface EvalOption {
  id: string;
  title: string;
  type: EvaluationType;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Asignando…' : 'Asignar'}
    </Button>
  );
}

export function AssignEvaluationForm({
  action,
  jobId,
  available,
}: {
  action: Action;
  jobId: string;
  available: EvalOption[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay más evaluaciones disponibles para asignar.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex-1">
        <Select name="evaluationId" defaultValue="" required>
          <option value="" disabled>
            Selecciona una evaluación…
          </option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({EVALUATION_TYPE_LABELS[e.type]})
            </option>
          ))}
        </Select>
      </div>
      <SubmitButton />
    </form>
  );
}
