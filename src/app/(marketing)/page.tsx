import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, ScanSearch, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight text-primary">Angélica</span>
        <nav className="flex items-center gap-3">
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Crear cuenta</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild size="sm">
              <Link href="/dashboard">Ir al panel</Link>
            </Button>
          </SignedIn>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Reclutamiento con IA para LATAM
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Contrata mejor, sin sesgos y con decisiones explicables
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Estandariza hojas de vida, oculta datos sesgantes y calcula el Índice de Ajuste al Cargo
          (IAC) para rankear candidatos de forma transparente.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/sign-up">
              Empezar gratis <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid w-full gap-6 text-left sm:grid-cols-3">
          <Feature
            icon={ScanSearch}
            title="Reclutamiento ciego"
            description="Oculta nombre, foto, edad, género y universidad en etapas iniciales."
          />
          <Feature
            icon={BarChart3}
            title="IAC explicable"
            description="Una puntuación de 0 a 100 con el porqué de cada resultado."
          />
          <Feature
            icon={ShieldCheck}
            title="Privacidad por diseño"
            description="Datos sensibles separados y auditoría de acciones desde el día 1."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Icon className="size-6 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
