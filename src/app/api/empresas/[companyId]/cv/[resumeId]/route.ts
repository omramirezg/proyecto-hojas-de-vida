import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getResumeFile } from '@/features/candidates/repository';
import { getSignedResumeUrl } from '@/lib/storage';

/**
 * Descarga segura de un CV: re-verifica sesión + pertenencia + permiso en cada acceso,
 * y entrega una URL firmada de corta duración (el bucket es privado).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string; resumeId: string }> },
) {
  const { companyId, resumeId } = await params;

  const session = await getSession();
  if (!session) return new Response('No autorizado', { status: 401 });

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership || !hasPermission(membership.role, 'candidate:manage')) {
    return new Response('Prohibido', { status: 403 });
  }

  const resume = await getResumeFile(companyId, resumeId);
  if (!resume) return new Response('No encontrado', { status: 404 });

  try {
    const url = await getSignedResumeUrl(resume.storagePath, 60);
    return Response.redirect(url, 302);
  } catch {
    return new Response('Almacenamiento no disponible', { status: 503 });
  }
}
