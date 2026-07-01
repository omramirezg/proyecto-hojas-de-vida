'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { type ActionState, toActionError } from '@/lib/action-state';
import { computeApplicationIac, recomputeJobIac } from './service';

function iacErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('IAC_NO_RESUME'))
    return 'Primero procesa el CV del candidato (Fase 5) para poder calcular el IAC.';
  if (msg.includes('APPLICATION_NOT_FOUND')) return 'No se encontró la postulación.';
  return 'No se pudo calcular el IAC. Inténtalo de nuevo.';
}

// ── Calcular IAC de una postulación ─────────────────────────────
export async function computeIacAction(
  companyId: string,
  candidateId: string,
  applicationId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const result = await computeApplicationIac(companyId, applicationId, user.id);

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    return { ok: true, message: `IAC calculado: ${result.overall}/100.` };
  } catch (error) {
    const auth =
      error instanceof Error &&
      ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_A_MEMBER'].includes(error.message);
    return auth ? toActionError(error) : { ok: false, message: iacErrorMessage(error) };
  }
}

// ── Recalcular ranking de una vacante ───────────────────────────
export async function recomputeRankingAction(
  companyId: string,
  jobId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'job:manage');

    const summary = await recomputeJobIac(companyId, jobId, user.id);

    revalidatePath(`/empresas/${companyId}/vacantes/${jobId}/ranking`);
    return {
      ok: true,
      message:
        summary.computed === 0
          ? 'No hay candidatos con CV procesado para calcular. Procesa sus CV primero.'
          : `Ranking recalculado: ${summary.computed} candidato(s)${summary.skipped > 0 ? `, ${summary.skipped} omitido(s) sin CV procesado` : ''}.`,
    };
  } catch (error) {
    return toActionError(error);
  }
}
