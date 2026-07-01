'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/shared/field-error';
import { EVALUATION_TYPE_LABELS } from '../constants';
import type { EvaluationType } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface EvalOption {
  id: string;
  title: string;
  type: EvaluationType;
  maxScore: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Registrando…' : 'Registrar resultado'}
    </Button>
  );
}

export function RecordResultForm({
  action,
  evaluations,
}: {
  action: Action;
  evaluations: EvalOption[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      ref.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  if (evaluations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crea evaluaciones en la sección de evaluaciones de la empresa para poder registrar
        resultados.
      </p>
    );
  }

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label htmlFor="evaluationId">Evaluación</Label>
          <Select id="evaluationId" name="evaluationId" defaultValue="" required className="mt-1.5">
            <option value="" disabled>
              Selecciona…
            </option>
            {evaluations.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({EVALUATION_TYPE_LABELS[e.type]}) · máx {e.maxScore}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.evaluationId} />
        </div>
        <div>
          <Label htmlFor="score">Puntaje obtenido</Label>
          <Input
            id="score"
            name="score"
            type="number"
            min={0}
            step="0.01"
            required
            className="mt-1.5 w-32"
          />
          <FieldError errors={state.fieldErrors?.score} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" placeholder="Observaciones del evaluador…" className="mt-1.5" />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
