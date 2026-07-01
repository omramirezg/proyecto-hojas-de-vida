import type { Metadata } from 'next';
import { getAssignmentByToken } from '@/features/evaluations/repository';
import { submitEvaluationAction } from '@/features/evaluations/actions';
import { parseQuestions } from '@/features/evaluations/questions';
import { EvaluationTaker } from '@/features/evaluations/components/evaluation-taker';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

export const metadata: Metadata = { title: 'Prueba de evaluación' };

export default async function PublicEvaluationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const assignment = await getAssignmentByToken(token);

  const questions = assignment ? parseQuestions(assignment.evaluation.questions) : [];
  const invalid = !assignment || questions.length === 0;
  const done = assignment?.status === 'COMPLETED';

  return (
    <main className="min-h-screen bg-secondary/40 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <p className="mb-6 text-center text-lg font-bold text-primary">{APP_NAME}</p>

        {invalid ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <AlertTriangle className="size-10 text-warning" />
              <h1 className="mt-4 text-lg font-semibold">Enlace no válido</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta prueba no existe o el enlace es incorrecto.
              </p>
            </CardContent>
          </Card>
        ) : done ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <h1 className="mt-4 text-lg font-semibold">Prueba ya respondida</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta evaluación ya fue completada. Gracias.
              </p>
            </CardContent>
          </Card>
        ) : (
          <EvaluationTaker
            action={submitEvaluationAction.bind(null, token)}
            title={assignment!.evaluation.title}
            candidateName={assignment!.candidate.fullName.split(' ')[0] ?? ''}
            // Importante: no enviamos correctIndex al navegador.
            questions={questions.map((q) => ({ text: q.text, options: q.options }))}
          />
        )}
      </div>
    </main>
  );
}
