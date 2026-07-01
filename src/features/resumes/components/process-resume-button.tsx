'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Sparkles className="size-4" /> {pending ? 'Procesando…' : label}
    </Button>
  );
}

export function ProcessResumeButton({ action, label = 'Procesar' }: { action: Action; label?: string }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return <form action={formAction}>{<Inner label={label} />}</form>;
}
