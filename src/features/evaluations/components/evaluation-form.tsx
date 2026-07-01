'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/shared/field-error';
import { EVALUATION_TYPES } from '../constants';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? 'Guardando…' : 'Crear evaluación'}
    </Button>
  );
}

export function EvaluationForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Prueba técnica de backend"
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Tipo *</Label>
          <Select id="type" name="type" defaultValue="TECHNICAL" className="mt-1.5">
            {EVALUATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="maxScore">Puntaje máximo *</Label>
          <Input
            id="maxScore"
            name="maxScore"
            type="number"
            min={1}
            defaultValue={100}
            className="mt-1.5"
          />
          <FieldError errors={state.fieldErrors?.maxScore} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="¿Qué evalúa esta prueba?"
          className="mt-1.5"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
