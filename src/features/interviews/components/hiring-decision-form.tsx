'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function DecisionButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-2">
      <Button type="submit" name="decision" value="SELECTED" disabled={pending}>
        <CheckCircle2 className="size-4" /> Seleccionar
      </Button>
      <Button type="submit" name="decision" value="REJECTED" variant="destructive" disabled={pending}>
        <XCircle className="size-4" /> Descartar
      </Button>
    </div>
  );
}

export function HiringDecisionForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Justificación de la decisión…"
          className="mt-1.5"
        />
      </div>
      <DecisionButtons />
    </form>
  );
}
