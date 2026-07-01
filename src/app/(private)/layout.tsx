import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SidebarNav } from '@/components/shared/sidebar-nav';
import { AppHeader } from '@/components/shared/app-header';
import { APP_NAME } from '@/lib/brand';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Doble muralla: el middleware ya protege, pero verificamos también en el server.
  if (!session) redirect('/sign-in');

  const { user, memberships } = session;
  const activeMembership = memberships[0]; // Fase 2 añadirá selector de empresa activa.

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0]!;

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-bold tracking-tight text-primary">{APP_NAME}</span>
        </div>
        <SidebarNav companyId={activeMembership?.companyId} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          fullName={fullName}
          email={user.email}
          companyName={activeMembership?.company.name}
          role={activeMembership?.role}
          isPlatformAdmin={user.isPlatformAdmin}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
