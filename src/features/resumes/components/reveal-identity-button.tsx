'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Inner() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Eye className="size-4" /> {pending ? 'Revelando…' : 'Revelar identidad'}
    </Button>
  );
}

export function RevealIdentityButton({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return <form action={formAction}>{<Inner />}</form>;
}
