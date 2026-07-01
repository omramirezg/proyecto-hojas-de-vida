'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  ClipboardCheck,
  CalendarDays,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Deshabilitado (sin página disponible o sin empresa activa). */
  disabled?: boolean;
  hint?: string;
}

/**
 * Construye los ítems del menú. Las secciones de empresa (vacantes, candidatos…)
 * apuntan a la empresa ACTIVA. Si no hay empresa, quedan deshabilitadas.
 */
function buildItems(companyId?: string): NavItem[] {
  const co = (path: string) => (companyId ? `/empresas/${companyId}${path}` : '');
  const needsCompany = !companyId;

  return [
    { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Empresas', href: '/empresas', icon: Building2 },
    {
      label: 'Vacantes',
      href: co('/vacantes'),
      icon: Briefcase,
      disabled: needsCompany,
      hint: 'Crea una empresa primero',
    },
    {
      label: 'Candidatos',
      href: co('/candidatos'),
      icon: Users,
      disabled: needsCompany,
      hint: 'Crea una empresa primero',
    },
    {
      label: 'Evaluaciones',
      href: co('/evaluaciones'),
      icon: ClipboardCheck,
      disabled: needsCompany,
      hint: 'Crea una empresa primero',
    },
    {
      label: 'Entrevistas',
      href: '#',
      icon: CalendarDays,
      disabled: true,
      hint: 'Se gestionan desde cada candidato → Proceso',
    },
    {
      label: 'Configuración',
      href: co(''),
      icon: Settings,
      disabled: needsCompany,
      hint: 'Crea una empresa primero',
    },
  ];
}

export function SidebarNav({ companyId }: { companyId?: string }) {
  const pathname = usePathname();
  const items = buildItems(companyId);

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const isActive =
          item.href !== '#' &&
          item.href !== '' &&
          (pathname === item.href || pathname.startsWith(item.href + '/'));
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              title={item.hint}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {item.label}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">Pronto</span>
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
