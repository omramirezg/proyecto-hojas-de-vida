import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * Seed idempotente para desarrollo.
 * Crea una empresa demo. La membresía real se asocia cuando un usuario de Clerk
 * inicia sesión (Fase 2 conectará usuario ↔ empresa).
 */
async function main() {
  const company = await db.company.upsert({
    where: { slug: 'empresa-demo' },
    update: {},
    create: {
      name: 'Empresa Demo',
      slug: 'empresa-demo',
      sector: 'Tecnología',
      size: 'MICRO',
      country: 'CO',
    },
  });

  await db.auditLog.create({
    data: { action: 'seed.executed', companyId: company.id, entityType: 'Company', entityId: company.id },
  });

  // eslint-disable-next-line no-console
  console.warn('✔ Seed completado. Empresa demo:', company.slug);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
