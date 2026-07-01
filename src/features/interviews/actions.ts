'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import {
  scheduleInterviewSchema,
  updateInterviewSchema,
  hiringDecisionSchema,
} from './schemas';
import { sendEmail } from '@/lib/email';
import { composeInterviewEmail } from './email-template';
import * as repo from './repository';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

const processPath = (companyId: string, applicationId: string) =>
  `/empresas/${companyId}/postulaciones/${applicationId}`;

// ── Programar entrevista ────────────────────────────────────────
export async function scheduleInterviewAction(
  companyId: string,
  applicationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = scheduleInterviewSchema.safeParse({
      applicationId,
      scheduledAt: str(formData, 'scheduledAt'),
      mode: str(formData, 'mode'),
      location: str(formData, 'location'),
      notes: str(formData, 'notes'),
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    if (!(await repo.applicationBelongsToCompany(companyId, applicationId))) {
      return { ok: false, message: 'La postulación no existe en esta empresa.' };
    }

    const interview = await repo.createInterview({
      companyId,
      applicationId,
      scheduledAt: parsed.data.scheduledAt,
      mode: parsed.data.mode,
      location: parsed.data.location,
      notes: parsed.data.notes,
      interviewerId: user.id,
    });

    await recordAudit({
      action: 'interview.scheduled',
      actorId: user.id,
      companyId,
      entityType: 'Interview',
      entityId: interview.id,
      metadata: { applicationId, scheduledAt: parsed.data.scheduledAt.toISOString() },
    });

    revalidatePath(processPath(companyId, applicationId));
    return { ok: true, message: 'Entrevista programada.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Actualizar entrevista (estado + observaciones) ──────────────
export async function updateInterviewAction(
  companyId: string,
  applicationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = updateInterviewSchema.safeParse({
      interviewId: str(formData, 'interviewId'),
      status: str(formData, 'status'),
      notes: str(formData, 'notes'),
    });
    if (!parsed.success) return { ok: false, message: 'Datos inválidos.' };

    await repo.updateInterview(companyId, parsed.data.interviewId, parsed.data.status, parsed.data.notes);

    await recordAudit({
      action: 'interview.updated',
      actorId: user.id,
      companyId,
      entityType: 'Interview',
      entityId: parsed.data.interviewId,
      metadata: { status: parsed.data.status },
    });

    revalidatePath(processPath(companyId, applicationId));
    return { ok: true, message: 'Entrevista actualizada.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Enviar la entrevista por correo al candidato ────────────────
export async function sendInterviewEmailAction(
  companyId: string,
  applicationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const interviewId = str(formData, 'interviewId');
    const interview = await repo.getInterviewForEmail(companyId, interviewId);
    if (!interview) return { ok: false, message: 'No se encontró la entrevista.' };

    const email = interview.application.candidate.email;
    if (!email) {
      return {
        ok: false,
        message: 'El candidato no tiene correo. Edítalo para agregarlo antes de enviar.',
      };
    }

    const { subject, html } = composeInterviewEmail({
      candidateName: interview.application.candidate.fullName,
      jobTitle: interview.application.job.title,
      companyName: interview.application.job.company.name,
      scheduledAt: interview.scheduledAt,
      mode: interview.mode,
      location: interview.location,
      notes: interview.notes,
    });

    await sendEmail({ to: email, subject, html });

    await recordAudit({
      action: 'interview.email_sent',
      actorId: user.id,
      companyId,
      entityType: 'Interview',
      entityId: interview.id,
      metadata: { to: email },
    });

    revalidatePath(`/empresas/${companyId}/postulaciones/${applicationId}`);
    return { ok: true, message: `Correo enviado a ${email}.` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('EMAIL_NOT_CONFIGURED'))
      return { ok: false, message: 'El correo no está configurado (falta RESEND_API_KEY).' };
    if (msg.includes('EMAIL_SEND_FAILED'))
      return {
        ok: false,
        message:
          'No se pudo enviar. Sin dominio verificado, Resend solo entrega a tu propio correo de la cuenta.',
      };
    return toActionError(error);
  }
}

// ── Decisión de contratación (seleccionar / descartar) ──────────
export async function decideHiringAction(
  companyId: string,
  applicationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'candidate:manage');

    const parsed = hiringDecisionSchema.safeParse({
      applicationId,
      decision: str(formData, 'decision'),
      reason: str(formData, 'reason'),
    });
    if (!parsed.success) return { ok: false, message: 'Selecciona una decisión válida.' };

    await repo.decideHiring({
      companyId,
      applicationId,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      decidedById: user.id,
    });

    await recordAudit({
      action: 'hiring.decided',
      actorId: user.id,
      companyId,
      entityType: 'HiringDecision',
      entityId: applicationId,
      metadata: { decision: parsed.data.decision },
    });

    revalidatePath(processPath(companyId, applicationId));
    return {
      ok: true,
      message: parsed.data.decision === 'SELECTED' ? 'Candidato seleccionado.' : 'Candidato descartado.',
    };
  } catch (error) {
    return toActionError(error);
  }
}
