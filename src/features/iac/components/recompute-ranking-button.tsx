'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <RefreshCw className={`size-4 ${pending ? 'animate-spin' : ''}`} />{' '}
      {pending ? 'Recalculando…' : 'Recalcular ranking'}
    </Button>
  );
}

export function RecomputeRankingButton({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return <form action={formAction}>{<Inner />}</form>;
}
