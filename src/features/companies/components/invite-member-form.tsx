'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState } from '@/lib/action-state';
import { inviteMemberAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/shared/field-error';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Invitar'}
    </Button>
  );
}

export function InviteMemberForm({ companyId }: { companyId: string }) {
  const [state, formAction] = useActionState(inviteMemberAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="flex-1">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="persona@empresa.com"
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>
      <div className="sm:w-48">
        <Label htmlFor="role">Rol</Label>
        <Select id="role" name="role" defaultValue="RECRUITER" className="mt-1.5">
          <option value="COMPANY_ADMIN">Admin de empresa</option>
          <option value="RECRUITER">Reclutador</option>
          <option value="EVALUATOR">Evaluador</option>
        </Select>
        <FieldError errors={state.fieldErrors?.role} />
      </div>
      <SubmitButton />
    </form>
  );
}
