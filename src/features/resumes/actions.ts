'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import { processResume } from './service';

function processErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('STORAGE_NOT_CONFIGURED'))
    return 'El almacenamiento no está configurado (revisa las claves de Supabase).';
  if (msg.includes('UNSUPPORTED_FORMAT'))
    return 'Formato no compatible para extracción. Usa PDF o .docx.';
  if (msg.includes('EMPTY_TEXT'))
    return 'No se encontró texto legible (¿PDF escaneado o imagen?). Sube un PDF con texto.';
  if (msg.includes('PARSE_FAILED')) return 'No se pudo leer el archivo. Verifica que no esté dañado.';
  if (msg.startsWith('AI_')) return 'La IA no pudo estructurar el CV. Inténtalo de nuevo.';
  return 'No se pudo procesar el CV. Inténtalo de nuevo.';
}

// ── Procesar CV (extracción + IA + separación) ──────────────────
export async function processResumeAction(
  companyId: string,
  candidateId: string,
  resumeId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const result = await processResume(companyId, resumeId, user.id);

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    return {
      ok: true,
      message:
        result.parserName === 'heuristic'
          ? 'CV procesado (modo básico sin IA; configura OPENAI_API_KEY para mejor calidad).'
          : 'CV procesado y estandarizado correctamente.',
    };
  } catch (error) {
    // toActionError cubre errores de autorización; el resto, mensaje específico.
    const auth = error instanceof Error && ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_A_MEMBER'].includes(error.message);
    return auth ? toActionError(error) : { ok: false, message: processErrorMessage(error) };
  }
}

// ── Revelar identidad (reclutamiento ciego → desbloqueo auditado) ─
export async function revealIdentityAction(
  companyId: string,
  candidateId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:reveal');

    await recordAudit({
      action: 'candidate.identity_revealed',
      actorId: user.id,
      companyId,
      entityType: 'Candidate',
      entityId: candidateId,
    });
  } catch (error) {
    return toActionError(error);
  }

  redirect(`/empresas/${companyId}/candidatos/${candidateId}?revelar=1`);
}
