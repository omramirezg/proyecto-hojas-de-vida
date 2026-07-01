import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { recordAudit } from '@/features/audit/service';

/**
 * Webhook de Clerk: mantiene la tabla User sincronizada con la fuente de verdad (Clerk).
 * Eventos: user.created, user.updated, user.deleted.
 *
 * Seguridad: la firma se verifica con svix usando CLERK_WEBHOOK_SECRET.
 * Esta ruta es pública (ver middleware) pero rechaza cualquier payload sin firma válida.
 */

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Webhook no configurado', { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Faltan cabeceras svix', { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    event = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response('Firma inválida', { status: 400 });
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
        event.data;

      const email =
        email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
        email_addresses[0]?.email_address;

      if (!email) break;

      await db.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
        update: {
          email,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
      });

      await recordAudit({
        action: event.type === 'user.created' ? 'user.created' : 'user.updated',
        entityType: 'User',
        entityId: id,
      });
      break;
    }

    case 'user.deleted': {
      const id = event.data.id;
      if (!id) break;
      // Soft delete para preservar integridad histórica (auditoría, candidaturas).
      await db.user.updateMany({
        where: { clerkId: id },
        data: { deletedAt: new Date() },
      });
      await recordAudit({ action: 'user.deleted', entityType: 'User', entityId: id });
      break;
    }

    default:
      break;
  }

  return new Response('OK', { status: 200 });
}
