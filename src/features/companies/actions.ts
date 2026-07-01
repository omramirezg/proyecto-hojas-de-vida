'use server';

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import { companyCreateSchema, companyUpdateSchema, inviteMemberSchema } from './schemas';
import * as repo from './repository';

const INVITE_TTL_DAYS = 7;

function parseForm<S extends z.ZodTypeAny>(schema: S, formData: FormData) {
  return schema.safeParse(Object.fromEntries(formData.entries()));
}

// ── Crear empresa ───────────────────────────────────────────────
export async function createCompanyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let companyId: string;
  try {
    const { user } = await requireSession();
    const parsed = parseForm(companyCreateSchema, formData);
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const company = await repo.createCompanyWithOwner(user.id, parsed.data);
    companyId = company.id;

    await recordAudit({
      action: 'company.created',
      actorId: user.id,
      companyId: company.id,
      entityType: 'Company',
      entityId: company.id,
      metadata: { name: company.name },
    });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/empresas');
  redirect(`/empresas/${companyId}`);
}

// ── Editar empresa ──────────────────────────────────────────────
export async function updateCompanyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    const parsed = parseForm(companyUpdateSchema, formData);
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { companyId, ...data } = parsed.data;
    await requirePermission(companyId, 'company:manage');
    await repo.updateCompany(companyId, data);

    await recordAudit({
      action: 'company.updated',
      actorId: user.id,
      companyId,
      entityType: 'Company',
      entityId: companyId,
    });

    revalidatePath(`/empresas/${companyId}`);
    return { ok: true, message: 'Empresa actualizada correctamente.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Invitar miembro ─────────────────────────────────────────────
export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    const parsed = parseForm(inviteMemberSchema, formData);
    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const { companyId, email, role } = parsed.data;
    await requirePermission(companyId, 'member:invite');

    const existing = await repo.findExistingMemberByEmail(companyId, email);
    if (existing) {
      return { ok: false, fieldErrors: { email: ['Esa persona ya es miembro de la empresa.'] } };
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await repo.createInvitation({ companyId, email, role, token, expiresAt, invitedById: user.id });

    await recordAudit({
      action: 'member.invited',
      actorId: user.id,
      companyId,
      entityType: 'Invitation',
      metadata: { email, role },
    });

    revalidatePath(`/empresas/${companyId}`);
    return { ok: true, message: `Invitación creada para ${email}.` };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Revocar invitación ──────────────────────────────────────────
export async function revokeInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    const companyId = String(formData.get('companyId') ?? '');
    const invitationId = String(formData.get('invitationId') ?? '');
    if (!companyId || !invitationId) return { ok: false, message: 'Datos incompletos.' };

    await requirePermission(companyId, 'member:invite');
    await repo.revokeInvitation(companyId, invitationId);

    await recordAudit({
      action: 'member.invitation_revoked',
      actorId: user.id,
      companyId,
      entityType: 'Invitation',
      entityId: invitationId,
    });

    revalidatePath(`/empresas/${companyId}`);
    return { ok: true, message: 'Invitación revocada.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Aceptar invitación ──────────────────────────────────────────
export async function acceptInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let redirectTo: string | null = null;
  try {
    const { user } = await requireSession();
    const token = String(formData.get('token') ?? '');
    const invitation = await repo.getInvitationByToken(token);

    if (!invitation || invitation.status !== 'PENDING') {
      return { ok: false, message: 'La invitación no es válida o ya fue usada.' };
    }
    if (invitation.expiresAt < new Date()) {
      return { ok: false, message: 'La invitación expiró. Pide una nueva.' };
    }
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return {
        ok: false,
        message: `Esta invitación es para ${invitation.email}. Inicia sesión con ese correo.`,
      };
    }

    await repo.acceptInvitationTx({
      invitationId: invitation.id,
      companyId: invitation.companyId,
      userId: user.id,
      role: invitation.role,
    });

    await recordAudit({
      action: 'member.invitation_accepted',
      actorId: user.id,
      companyId: invitation.companyId,
      entityType: 'CompanyMember',
      metadata: { role: invitation.role },
    });

    redirectTo = `/empresas/${invitation.companyId}`;
  } catch (error) {
    return toActionError(error);
  }

  if (!redirectTo) return { ok: false, message: 'No se pudo aceptar la invitación.' };
  revalidatePath('/empresas');
  redirect(redirectTo);
}
