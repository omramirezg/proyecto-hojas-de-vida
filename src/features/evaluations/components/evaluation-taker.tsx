'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface PublicQuestion {
  text: string;
  options: string[];
}

export function EvaluationTaker({
  action,
  title,
  candidateName,
  questions,
}: {
  action: Action;
  title: string;
  candidateName: string;
  questions: PublicQuestion[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  // Pantalla de resultado tras enviar.
  if (state.ok) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="size-12 text-success" />
          <h2 className="mt-4 text-xl font-semibold">¡Prueba enviada!</h2>
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
          <p className="mt-4 text-xs text-muted-foreground">Ya puedes cerrar esta página.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Hola {candidateName}. Responde las {questions.length} preguntas y envía. Solo puedes
          enviarla una vez.
        </p>
      </div>

      {questions.map((q, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">
              {i + 1}. {q.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, j) => (
              <label
                key={j}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
              >
                <input type="radio" name={`answer_${i}`} value={j} required className="size-4" />
                {opt}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      {!state.ok && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? 'Enviando…' : 'Enviar respuestas'}
    </Button>
  );
}
