'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Sparkles className="size-4" /> {pending ? 'Generando…' : 'Generar prueba con IA'}
    </Button>
  );
}

export function GenerateEvaluationForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Tipo de prueba</label>
        <Select name="type" defaultValue="TECHNICAL" className="w-48">
          <option value="TECHNICAL">Técnica (conocimiento)</option>
          <option value="SOFT">Blanda (situacional)</option>
        </Select>
      </div>
      <SubmitButton />
    </form>
  );
}
