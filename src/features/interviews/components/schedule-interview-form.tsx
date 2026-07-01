'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/shared/field-error';
import { INTERVIEW_MODES } from '../constants';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <CalendarPlus className="size-4" /> {pending ? 'Programando…' : 'Programar entrevista'}
    </Button>
  );
}

export function ScheduleInterviewForm({ action }: { action: Action }) {
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

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="scheduledAt">Fecha y hora *</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required className="mt-1.5" />
          <FieldError errors={state.fieldErrors?.scheduledAt} />
        </div>
        <div>
          <Label htmlFor="mode">Modalidad *</Label>
          <Select id="mode" name="mode" defaultValue="REMOTE" className="mt-1.5">
            {INTERVIEW_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="location">Lugar o enlace</Label>
        <Input
          id="location"
          name="location"
          placeholder="https://meet… o dirección"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" placeholder="Agenda, temas a tratar…" className="mt-1.5" />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
