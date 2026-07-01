'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import { isStorageConfigured } from '@/lib/supabase';
import { uploadResume } from '@/lib/storage';
import {
  candidateCreateSchema,
  applyToJobSchema,
  changeApplicationStatusSchema,
} from './schemas';
import { validateResumeFile, validateResumeMagicBytes } from './file-validation';
import * as repo from './repository';
import type { CandidateSource } from '@prisma/client';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

/** Sube un CV a Storage y crea el registro ResumeFile. Lanza si algo falla. */
async function storeResume(params: {
  companyId: string;
  candidateId: string;
  actorId: string;
  file: File;
}) {
  const { companyId, candidateId, file } = params;

  const validation = validateResumeFile({ name: file.name, type: file.type, size: file.size });
  if (!validation.ok) throw new Error(`FILE_INVALID:${validation.error}`);

  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');

  const ext = file.name.toLowerCase().split('.').pop() ?? 'bin';
  const storagePath = `${companyId}/${candidateId}/${randomBytes(12).toString('hex')}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Verificación profunda del contenido real (no solo extensión/MIME).
  const magic = validateResumeMagicBytes(buffer);
  if (!magic.ok) throw new Error(`FILE_INVALID:${magic.error}`);

  await uploadResume({
    path: storagePath,
    data: buffer,
    contentType: file.type || 'application/octet-stream',
  });

  const resume = await repo.createResumeFile({
    companyId,
    candidateId,
    fileName: file.name,
    storagePath,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });

  await recordAudit({
    action: 'resume.uploaded',
    actorId: params.actorId,
    companyId,
    entityType: 'ResumeFile',
    entityId: resume.id,
    metadata: { fileName: file.name, sizeBytes: file.size },
  });

  return resume;
}

/** Traduce errores específicos de archivo/almacenamiento a mensajes legibles. */
function fileErrorToState(error: unknown): ActionState | null {
  const msg = error instanceof Error ? error.message : '';
  if (msg.startsWith('FILE_INVALID:')) return { ok: false, message: msg.replace('FILE_INVALID:', '') };
  if (msg.startsWith('STORAGE_NOT_CONFIGURED'))
    return {
      ok: false,
      message: 'El almacenamiento de archivos no está configurado (revisa las claves de Supabase).',
    };
  if (msg.startsWith('STORAGE_UPLOAD_FAILED'))
    return { ok: false, message: 'No se pudo subir el archivo. Inténtalo de nuevo.' };
  return null;
}

// ── Crear candidato (con CV y postulación opcionales) ───────────
export async function createCandidateAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let candidateId: string;
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = candidateCreateSchema.safeParse({
      fullName: str(formData, 'fullName'),
      email: str(formData, 'email'),
      phone: str(formData, 'phone'),
      source: str(formData, 'source'),
      notes: str(formData, 'notes'),
      jobId: str(formData, 'jobId'),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const fileEntry = formData.get('cv');
    const hasFile = fileEntry instanceof File && fileEntry.size > 0;

    const source: CandidateSource =
      parsed.data.source ?? (hasFile ? 'UPLOAD' : 'MANUAL');

    const candidate = await repo.createCandidate(companyId, parsed.data, source);
    candidateId = candidate.id;

    await recordAudit({
      action: 'candidate.created',
      actorId: user.id,
      companyId,
      entityType: 'Candidate',
      entityId: candidate.id,
    });

    if (hasFile) {
      await storeResume({ companyId, candidateId, actorId: user.id, file: fileEntry });
    }

    if (parsed.data.jobId && (await repo.jobBelongsToCompany(companyId, parsed.data.jobId))) {
      await repo.applyToJob({ companyId, candidateId, jobId: parsed.data.jobId });
    }
  } catch (error) {
    return fileErrorToState(error) ?? toActionError(error);
  }

  revalidatePath(`/empresas/${companyId}/candidatos`);
  redirect(`/empresas/${companyId}/candidatos/${candidateId}`);
}

// ── Subir CV a un candidato existente ───────────────────────────
export async function uploadResumeAction(
  companyId: string,
  candidateId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const fileEntry = formData.get('cv');
    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return { ok: false, message: 'Selecciona un archivo de CV.' };
    }

    await storeResume({ companyId, candidateId, actorId: user.id, file: fileEntry });

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    return { ok: true, message: 'CV cargado correctamente.' };
  } catch (error) {
    return fileErrorToState(error) ?? toActionError(error);
  }
}

// ── Postular candidato a una vacante ────────────────────────────
export async function applyToJobAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = applyToJobSchema.safeParse({
      candidateId: str(formData, 'candidateId'),
      jobId: str(formData, 'jobId'),
    });
    if (!parsed.success) return { ok: false, message: 'Selecciona una vacante válida.' };

    if (!(await repo.jobBelongsToCompany(companyId, parsed.data.jobId))) {
      return { ok: false, message: 'La vacante no pertenece a esta empresa.' };
    }

    await repo.applyToJob({ companyId, ...parsed.data });

    await recordAudit({
      action: 'candidate.applied',
      actorId: user.id,
      companyId,
      entityType: 'CandidateApplication',
      metadata: { candidateId: parsed.data.candidateId, jobId: parsed.data.jobId },
    });

    revalidatePath(`/empresas/${companyId}/candidatos/${parsed.data.candidateId}`);
    return { ok: true, message: 'Candidato postulado a la vacante.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Cambiar estado de una postulación ───────────────────────────
export async function changeApplicationStatusAction(
  companyId: string,
  candidateId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Si el nuevo estado es "Entrevista", llevamos al usuario a programarla.
  let goToSchedule: string | null = null;
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = changeApplicationStatusSchema.safeParse({
      applicationId: str(formData, 'applicationId'),
      status: str(formData, 'status'),
    });
    if (!parsed.success) return { ok: false, message: 'Estado inválido.' };

    await repo.changeApplicationStatus(companyId, parsed.data.applicationId, parsed.data.status);

    await recordAudit({
      action: 'application.status_changed',
      actorId: user.id,
      companyId,
      entityType: 'CandidateApplication',
      entityId: parsed.data.applicationId,
      metadata: { status: parsed.data.status },
    });

    revalidatePath(`/empresas/${companyId}/candidatos/${candidateId}`);
    if (parsed.data.status === 'INTERVIEW') {
      goToSchedule = `/empresas/${companyId}/postulaciones/${parsed.data.applicationId}`;
    }
  } catch (error) {
    return toActionError(error);
  }

  // redirect() debe ir FUERA del try/catch (lanza NEXT_REDIRECT a propósito).
  if (goToSchedule) redirect(goToSchedule);
  return { ok: true, message: 'Estado actualizado.' };
}
