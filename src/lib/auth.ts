import { auth, currentUser } from '@clerk/nextjs/server';
import { cache } from 'react';
import { db } from '@/lib/db';
import type { CompanyMember, Company, User } from '@prisma/client';

/**
 * Capa de autenticación de la aplicación.
 *
 * Clerk es la fuente de verdad de la identidad; aquí resolvemos el usuario LOCAL
 * (tabla User) y su contexto de empresa. Toda la lógica de negocio usa estos helpers,
 * no llama a Clerk directamente, para poder cambiar de proveedor sin reescribir el dominio.
 */

export type MembershipWithCompany = CompanyMember & { company: Company };

export interface SessionContext {
  user: User;
  memberships: MembershipWithCompany[];
}

/**
 * Devuelve el usuario local + sus membresías, o null si no hay sesión.
 * Si el usuario existe en Clerk pero aún no en nuestra DB (webhook no llegó),
 * lo crea de forma idempotente (just-in-time provisioning).
 *
 * `cache` deduplica la consulta dentro de un mismo render de servidor.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({
    where: { clerkId },
    include: { memberships: { include: { company: true }, where: { deletedAt: null } } },
  });

  // Provisioning just-in-time como respaldo del webhook.
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) return null;

    user = await db.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        email: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      include: { memberships: { include: { company: true }, where: { deletedAt: null } } },
    });
  }

  return { user, memberships: user.memberships };
});

/** Igual que getSession pero lanza si no hay sesión (para Server Actions). */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}
