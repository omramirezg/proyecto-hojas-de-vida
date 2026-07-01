'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Mail className="size-4" /> {pending ? 'Enviando…' : 'Enviar por correo'}
    </Button>
  );
}

export function SendEmailButton({ action, interviewId }: { action: Action; interviewId: string }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="interviewId" value={interviewId} />
      <Inner />
    </form>
  );
}
