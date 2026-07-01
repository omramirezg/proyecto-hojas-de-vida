'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      <X className="size-4" /> Quitar
    </Button>
  );
}

export function UnassignEvaluationButton({
  action,
  jobId,
  evaluationId,
}: {
  action: Action;
  jobId: string;
  evaluationId: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="evaluationId" value={evaluationId} />
      <Inner />
    </form>
  );
}
