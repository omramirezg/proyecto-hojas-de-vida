import { UserButton } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/roles';
import type { CompanyRole } from '@prisma/client';

interface AppHeaderProps {
  fullName: string;
  email: string;
  companyName?: string;
  role?: CompanyRole;
  isPlatformAdmin: boolean;
}

export function AppHeader({
  fullName,
  email,
  companyName,
  role,
  isPlatformAdmin,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {companyName ?? 'Sin empresa'}
        </span>
        {isPlatformAdmin ? (
          <Badge variant="default">{ROLE_LABELS.SUPERADMIN}</Badge>
        ) : role ? (
          <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{fullName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
