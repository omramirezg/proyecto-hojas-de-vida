'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState } from '@/lib/action-state';
import { acceptInvitationAction } from '../actions';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Uniéndote…' : 'Unirme a la empresa'}
    </Button>
  );
}

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInvitationAction, initialActionState);

  useEffect(() => {
    if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <SubmitButton />
    </form>
  );
}
