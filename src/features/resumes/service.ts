import type { Prisma } from '@prisma/client';
import { downloadResume } from '@/lib/storage';
import { isStorageConfigured } from '@/lib/supabase';
import { extractTextFromResume } from '@/lib/cv/extract-text';
import { getAIProvider } from '@/lib/ai';
import { getResumeFile } from '@/features/candidates/repository';
import { recordAudit } from '@/features/audit/service';
import * as repo from './repository';

const MAX_STORED_TEXT = 50_000;

export interface ProcessResult {
  parserName: string;
  candidateId: string;
}

/**
 * Procesa un CV: descarga → extrae texto → IA estructura → separa visible/oculto → guarda.
 * Actualiza el estado del ResumeFile (PROCESSING → PROCESSED | FAILED) y audita.
 *
 * Nota de arquitectura: idealmente se ejecuta en una cola asíncrona. Aquí se invoca
 * desde una Server Action; para volúmenes altos, mover a Inngest/Trigger.dev (ver Fase 0).
 */
export async function processResume(
  companyId: string,
  resumeId: string,
  actorId: string,
): Promise<ProcessResult> {
  const resume = await getResumeFile(companyId, resumeId);
  if (!resume) throw new Error('RESUME_NOT_FOUND');

  if (!isStorageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');

  await repo.setResumeStatus(companyId, resumeId, 'PROCESSING', { errorMessage: null });

  try {
    const buffer = await downloadResume(resume.storagePath);
    const text = await extractTextFromResume(buffer, resume.mimeType, resume.fileName);

    const provider = getAIProvider();
    const parsed = await provider.parseResume(text);

    await repo.upsertStandardizedResume({
      companyId,
      candidateId: resume.candidateId,
      resumeFileId: resume.id,
      parserName: provider.name,
      visible: parsed.visible,
      raw: parsed as unknown as Prisma.InputJsonValue,
    });

    await repo.upsertHiddenData({
      companyId,
      candidateId: resume.candidateId,
      resumeFileId: resume.id,
      hidden: parsed.hidden,
    });

    await repo.setResumeStatus(companyId, resumeId, 'PROCESSED', {
      extractedText: text.slice(0, MAX_STORED_TEXT),
      errorMessage: null,
    });

    await recordAudit({
      action: 'resume.processed',
      actorId,
      companyId,
      entityType: 'ResumeFile',
      entityId: resume.id,
      metadata: { parser: provider.name, candidateId: resume.candidateId },
    });

    return { parserName: provider.name, candidateId: resume.candidateId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    await repo.setResumeStatus(companyId, resumeId, 'FAILED', { errorMessage: message });
    await recordAudit({
      action: 'resume.process_failed',
      actorId,
      companyId,
      entityType: 'ResumeFile',
      entityId: resume.id,
      metadata: { error: message },
    });
    throw error;
  }
}
