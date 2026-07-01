'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EVALUATION_TYPE_LABELS } from '../constants';
import type { EvaluationType } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface EvalOption {
  id: string;
  title: string;
  type: EvaluationType;
}

export interface AssignmentRow {
  id: string;
  token: string;
  status: string;
  evaluationTitle: string;
  evaluationType: EvaluationType;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Generando…' : 'Asignar prueba'}
    </Button>
  );
}

export function AssignTestPanel({
  action,
  evaluations,
  assignments,
}: {
  action: Action;
  evaluations: EvalOption[];
  assignments: AssignmentRow[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <div className="space-y-4">
      {assignments.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {assignments.map((a) => (
            <AssignmentItem key={a.id} assignment={a} />
          ))}
        </ul>
      ) : null}

      {evaluations.length > 0 ? (
        <form action={formAction} className="flex items-end gap-3">
          <div className="flex-1">
            <Select name="evaluationId" defaultValue="" required>
              <option value="" disabled>
                Selecciona una prueba con IA…
              </option>
              {evaluations.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({EVALUATION_TYPE_LABELS[e.type]})
                </option>
              ))}
            </Select>
          </div>
          <SubmitButton />
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay pruebas generadas con IA. Genera una desde la vacante (Vacante → Evaluaciones →
          «Generar prueba con IA»).
        </p>
      )}
    </div>
  );
}

function AssignmentItem({ assignment }: { assignment: AssignmentRow }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/evaluacion/${assignment.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado. Envíalo al candidato.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar.');
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{assignment.evaluationTitle}</p>
        <p className="text-xs text-muted-foreground">
          {EVALUATION_TYPE_LABELS[assignment.evaluationType]}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={assignment.status === 'COMPLETED' ? 'success' : 'secondary'}>
          {assignment.status === 'COMPLETED' ? 'Respondida' : 'Pendiente'}
        </Badge>
        {assignment.status !== 'COMPLETED' ? (
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Enlace
          </Button>
        ) : null}
      </div>
    </li>
  );
}
