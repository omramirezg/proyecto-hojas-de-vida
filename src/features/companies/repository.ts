import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';
import type { CompanyCreateInput } from './schemas';
import type { CompanyRole, Prisma } from '@prisma/client';

/**
 * Capa de acceso a datos para empresas, miembros e invitaciones.
 * Toda query filtra por tenant (companyId) o por pertenencia del usuario.
 */

/** Genera un slug único a partir del nombre (añade sufijo numérico si colisiona). */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'empresa';
  let candidate = base;
  let n = 1;
  // Pocas iteraciones en la práctica; el índice unique en slug es la garantía final.
  while (await db.company.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

/** Crea la empresa y asigna al creador como COMPANY_ADMIN, de forma atómica. */
export async function createCompanyWithOwner(userId: string, data: CompanyCreateInput) {
  const slug = await generateUniqueSlug(data.name);

  return db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.name,
        slug,
        sector: data.sector,
        size: data.size,
        country: data.country,
        website: data.website,
        logoUrl: data.logoUrl,
      },
    });

    await tx.companyMember.create({
      data: { userId, companyId: company.id, role: 'COMPANY_ADMIN', status: 'ACTIVE' },
    });

    return company;
  });
}

export async function getUserCompanies(userId: string) {
  return db.company.findMany({
    where: { deletedAt: null, members: { some: { userId, status: 'ACTIVE' } } },
    include: { _count: { select: { members: { where: { status: 'ACTIVE' } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompanyById(companyId: string) {
  return db.company.findFirst({ where: { id: companyId, deletedAt: null } });
}

export async function updateCompany(
  companyId: string,
  data: Omit<CompanyCreateInput, never>,
) {
  return db.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      sector: data.sector ?? null,
      size: data.size ?? null,
      country: data.country ?? null,
      website: data.website ?? null,
      logoUrl: data.logoUrl ?? null,
    },
  });
}

export async function listMembers(companyId: string) {
  return db.companyMember.findMany({
    where: { companyId, deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function listPendingInvitations(companyId: string) {
  return db.invitation.findMany({
    where: { companyId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findExistingMemberByEmail(companyId: string, email: string) {
  return db.companyMember.findFirst({
    where: { companyId, status: { not: 'SUSPENDED' }, user: { email } },
  });
}

export async function createInvitation(input: {
  companyId: string;
  email: string;
  role: CompanyRole;
  token: string;
  expiresAt: Date;
  invitedById: string;
}) {
  // Reactiva o reescribe una invitación pendiente previa para el mismo email.
  return db.invitation.upsert({
    where: {
      companyId_email_status: {
        companyId: input.companyId,
        email: input.email,
        status: 'PENDING',
      },
    },
    update: { role: input.role, token: input.token, expiresAt: input.expiresAt },
    create: {
      companyId: input.companyId,
      email: input.email,
      role: input.role,
      status: 'PENDING',
      token: input.token,
      expiresAt: input.expiresAt,
      invitedById: input.invitedById,
    },
  });
}

export async function getInvitationByToken(token: string) {
  return db.invitation.findUnique({ where: { token }, include: { company: true } });
}

export async function revokeInvitation(companyId: string, invitationId: string) {
  return db.invitation.updateMany({
    where: { id: invitationId, companyId, status: 'PENDING' },
    data: { status: 'REVOKED' },
  });
}

/** Acepta una invitación: crea/activa la membresía y marca la invitación, atómicamente. */
export async function acceptInvitationTx(params: {
  invitationId: string;
  companyId: string;
  userId: string;
  role: CompanyRole;
}) {
  return db.$transaction(async (tx) => {
    const membership = await tx.companyMember.upsert({
      where: { userId_companyId: { userId: params.userId, companyId: params.companyId } },
      update: { status: 'ACTIVE', role: params.role, deletedAt: null },
      create: {
        userId: params.userId,
        companyId: params.companyId,
        role: params.role,
        status: 'ACTIVE',
      },
    });

    await tx.invitation.update({
      where: { id: params.invitationId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    return membership;
  });
}

export type MemberWithUser = Prisma.CompanyMemberGetPayload<{ include: { user: true } }>;
