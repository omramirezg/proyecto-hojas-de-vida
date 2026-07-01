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
import { CANDIDATE_SOURCES, RESUME_ACCEPT } from '../constants';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface JobOption {
  id: string;
  title: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? 'Guardando…' : 'Crear candidato'}
    </Button>
  );
}

export function CandidateForm({ action, jobs }: { action: Action; jobs: JobOption[] }) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="fullName">Nombre completo *</Label>
        <Input id="fullName" name="fullName" required placeholder="Juana Pérez" className="mt-1.5" />
        <FieldError errors={state.fieldErrors?.fullName} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" placeholder="juana@correo.com" className="mt-1.5" />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="+57 300 000 0000" className="mt-1.5" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="source">Origen</Label>
          <Select id="source" name="source" defaultValue="MANUAL" className="mt-1.5">
            {CANDIDATE_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="jobId">Postular a vacante (opcional)</Label>
          <Select id="jobId" name="jobId" defaultValue="" className="mt-1.5">
            <option value="">No postular ahora</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="cv">Hoja de vida (PDF o Word)</Label>
        <input
          id="cv"
          name="cv"
          type="file"
          accept={RESUME_ACCEPT}
          className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Opcional. Formatos: .pdf, .doc, .docx (con texto, no escaneado). Para un perfil de
          LinkedIn, descárgalo como PDF («Más → Guardar como PDF») y súbelo. Después pulsa «Procesar
          con IA» en el candidato para extraer los datos.
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" placeholder="Notas internas del reclutador…" className="mt-1.5" />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
