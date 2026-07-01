'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import { evaluationCreateSchema, assignEvaluationSchema, recordResultSchema } from './schemas';
import { generateEvaluationForJob, submitEvaluationByToken } from './generate-service';
import * as repo from './repository';
import type { EvaluationType } from '@prisma/client';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

function aiErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('AI_NOT_CONFIGURED'))
    return 'La IA no está configurada (falta OPENAI_API_KEY).';
  if (msg.includes('JOB_NOT_FOUND')) return 'No se encontró la vacante.';
  if (msg.startsWith('AI_')) return 'La IA no pudo generar la prueba. Inténtalo de nuevo.';
  return 'No se pudo generar la prueba.';
}

// ── Crear evaluación ────────────────────────────────────────────
export async function createEvaluationAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const parsed = evaluationCreateSchema.safeParse({
      title: str(formData, 'title'),
      type: str(formData, 'type'),
      description: str(formData, 'description'),
      maxScore: str(formData, 'maxScore'),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const evaluation = await repo.createEvaluation(companyId, parsed.data);

    await recordAudit({
      action: 'evaluation.created',
      actorId: user.id,
      companyId,
      entityType: 'Evaluation',
      entityId: evaluation.id,
      metadata: { title: evaluation.title, type: evaluation.type },
    });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath(`/empresas/${companyId}/evaluaciones`);
  redirect(`/empresas/${companyId}/evaluaciones`);
}

// ── Asignar / quitar evaluación de una vacante ──────────────────
export async function assignEvaluationAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const parsed = assignEvaluationSchema.safeParse({
      jobId: str(formData, 'jobId'),
      evaluationId: str(formData, 'evaluationId'),
    });
    if (!parsed.success) return { ok: false, message: 'Selecciona una evaluación válida.' };

    await repo.assignEvaluationToJob(companyId, parsed.data.jobId, parsed.data.evaluationId);

    await recordAudit({
      action: 'evaluation.assigned',
      actorId: user.id,
      companyId,
      entityType: 'JobEvaluation',
      metadata: parsed.data,
    });

    revalidatePath(`/empresas/${companyId}/vacantes/${parsed.data.jobId}/evaluaciones`);
    return { ok: true, message: 'Evaluación asignada a la vacante.' };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unassignEvaluationAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const jobId = str(formData, 'jobId');
    const evaluationId = str(formData, 'evaluationId');
    if (!jobId || !evaluationId) return { ok: false, message: 'Datos incompletos.' };

    await repo.unassignEvaluationFromJob(companyId, jobId, evaluationId);

    await recordAudit({
      action: 'evaluation.unassigned',
      actorId: user.id,
      companyId,
      entityType: 'JobEvaluation',
      metadata: { jobId, evaluationId },
    });

    revalidatePath(`/empresas/${companyId}/vacantes/${jobId}/evaluaciones`);
    return { ok: true, message: 'Evaluación quitada de la vacante.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Registrar resultado de una evaluación a un candidato ────────
export async function recordResultAction(
  companyId: string,
  candidateId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const parsed = recordResultSchema.safeParse({
      evaluationId: str(formData, 'evaluationId'),
      candidateId,
      score: str(formData, 'score'),
      maxScore: str(formData, 'maxScore'),
      notes: str(formData, 'notes'),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    // Verifica que la evaluación pertenezca a la empresa y toma su maxScore real.
    const evaluation = await repo.getEvaluation(companyId, parsed.data.evaluationId);
    if (!evaluation) return { ok: false, message: 'La evaluación no existe en esta empresa.' };

    const maxScore = evaluation.maxScore;
    if (parsed.data.score > maxScore) {
      return { ok: false, fieldErrors: { score: [`El puntaje no puede superar ${maxScore}.`] } };
    }
    const normalizedScore = Math.round((parsed.data.score / maxScore) * 100);

    await repo.recordResult({
      companyId,
      evaluationId: parsed.data.evaluationId,
      candidateId,
      score: parsed.data.score,
      maxScore,
      normalizedScore,
      notes: parsed.data.notes,
      evaluatedById: user.id,
    });

    await recordAudit({
      action: 'evaluation.result_recorded',
      actorId: user.id,
      companyId,
      entityType: 'EvaluationResult',
      entityId: parsed.data.evaluationId,
      metadata: { candidateId, normalizedScore },
    });

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    return {
      ok: true,
      message: `Resultado registrado (${normalizedScore}/100). Recalcula el IAC para reflejarlo.`,
    };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Generar prueba con IA para una vacante ──────────────────────
export async function generateJobEvaluationAction(
  companyId: string,
  jobId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const type: EvaluationType = str(formData, 'type') === 'SOFT' ? 'SOFT' : 'TECHNICAL';
    await generateEvaluationForJob(companyId, jobId, type, user.id);

    revalidatePath(`/empresas/${companyId}/vacantes/${jobId}/evaluaciones`);
    return { ok: true, message: 'Prueba generada con IA y asignada a la vacante.' };
  } catch (error) {
    const auth =
      error instanceof Error &&
      ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_A_MEMBER'].includes(error.message);
    return auth ? toActionError(error) : { ok: false, message: aiErrorMessage(error) };
  }
}

// ── Asignar una prueba a un candidato (genera enlace) ───────────
export async function assignEvaluationToCandidateAction(
  companyId: string,
  candidateId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'evaluation:grade');

    const evaluationId = str(formData, 'evaluationId');
    if (!evaluationId) return { ok: false, message: 'Selecciona una prueba.' };

    const evaluation = await repo.getEvaluation(companyId, evaluationId);
    if (!evaluation) return { ok: false, message: 'La prueba no existe en esta empresa.' };

    const token = randomBytes(24).toString('hex');
    await repo.createAssignment({ companyId, evaluationId, candidateId, token });

    await recordAudit({
      action: 'evaluation.assigned_to_candidate',
      actorId: user.id,
      companyId,
      entityType: 'EvaluationAssignment',
      metadata: { candidateId, evaluationId },
    });

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    return { ok: true, message: 'Enlace de prueba generado. Cópialo y envíalo al candidato.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Enviar respuestas de la prueba (PÚBLICO, sin login) ─────────
export async function submitEvaluationAction(
  token: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    // Reconstruye las respuestas: answer_0, answer_1, ...
    const answers: number[] = [];
    for (let i = 0; formData.has(`answer_${i}`); i += 1) {
      answers[i] = Number(str(formData, `answer_${i}`));
    }

    const result = await submitEvaluationByToken(token, answers);
    return {
      ok: true,
      message: `¡Gracias! Respondiste ${result.correct} de ${result.total} (${result.normalizedScore}/100).`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('ALREADY_COMPLETED'))
      return { ok: false, message: 'Esta prueba ya fue respondida.' };
    if (msg.includes('ASSIGNMENT_NOT_FOUND') || msg.includes('NO_QUESTIONS'))
      return { ok: false, message: 'El enlace no es válido.' };
    return { ok: false, message: 'No se pudo enviar la prueba.' };
  }
}
