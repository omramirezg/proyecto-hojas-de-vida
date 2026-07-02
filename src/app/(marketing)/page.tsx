import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ShieldCheck,
  ScanSearch,
  BarChart3,
  Sparkles,
  FileText,
  Trophy,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { APP_NAME } from '@/lib/brand';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-40 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-64 -z-10 size-80 rounded-full bg-success/10 blur-3xl"
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              {APP_NAME}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
              <Sparkles className="size-3.5" /> Reclutamiento con IA para LATAM
            </span>
          </div>
          <nav className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-8 pt-20 text-center sm:pt-28">
        <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          Contrata mejor, sin sesgos y con decisiones explicables
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          Estandariza hojas de vida, oculta datos sesgantes y calcula el Índice de Ajuste al Cargo
          (IAC) para rankear candidatos de forma transparente.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/sign-up">
              Empezar gratis <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#como-funciona">Ver cómo funciona</Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" /> Gratis para empezar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" /> Sin tarjeta
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" /> IAC auditable
          </span>
        </div>
      </section>

      {/* Vista previa del producto */}
      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="rounded-2xl border bg-card/80 p-2 shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="rounded-xl border bg-background">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <span className="size-3 rounded-full bg-destructive/60" />
              <span className="size-3 rounded-full bg-warning/60" />
              <span className="size-3 rounded-full bg-success/60" />
              <span className="ml-3 flex items-center gap-2 text-sm font-medium">
                <Trophy className="size-4 text-primary" /> Ranking · Desarrollador Backend
              </span>
            </div>
            <div className="space-y-2 p-4">
              {[
                { code: 'A1B2', iac: 92, cat: 'Excelente', variant: 'success' as const, w: '92%' },
                { code: 'C7D4', iac: 81, cat: 'Buen ajuste', variant: 'default' as const, w: '81%' },
                { code: 'E5F9', iac: 66, cat: 'Ajuste parcial', variant: 'warning' as const, w: '66%' },
              ].map((r, i) => (
                <div key={r.code} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Candidato {r.code}</span>
                      <Badge variant={r.variant}>{r.cat}</Badge>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: r.w }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-lg font-bold tabular-nums">{r.iac}</span>
                </div>
              ))}
              <p className="px-1 pt-1 text-center text-xs text-muted-foreground">
                Identidad oculta · IAC calculado de forma determinista y explicable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          <Feature
            icon={ScanSearch}
            color="text-primary"
            bg="bg-primary/10"
            title="Reclutamiento ciego"
            description="Oculta nombre, foto, edad, género y universidad en etapas iniciales para decidir por méritos."
          />
          <Feature
            icon={BarChart3}
            color="text-success"
            bg="bg-success/10"
            title="IAC explicable"
            description="Una puntuación de 0 a 100 con el porqué de cada resultado. Nada de cajas negras."
          />
          <Feature
            icon={ShieldCheck}
            color="text-indigo-500"
            bg="bg-indigo-500/10"
            title="Privacidad por diseño"
            description="Datos sensibles separados y auditoría de acciones sensibles desde el primer día."
          />
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <p className="mt-2 text-muted-foreground">De la hoja de vida a la decisión, en 4 pasos.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Step n={1} icon={FileText} title="Carga el CV" text="Sube hojas de vida en PDF o Word." />
          <Step
            n={2}
            icon={Sparkles}
            title="Procesa con IA"
            text="Extrae y estandariza los datos, separando lo sesgante."
          />
          <Step
            n={3}
            icon={Trophy}
            title="Calcula el IAC"
            text="Rankea candidatos según los criterios de la vacante."
          />
          <Step
            n={4}
            icon={CalendarCheck}
            title="Entrevista y contrata"
            text="Agenda entrevistas y toma la decisión final."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_100%_0%,rgba(255,255,255,0.18),transparent)]"
          />
          <h2 className="text-balance text-3xl font-bold">Empieza a contratar con datos, no con corazonadas</h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-primary-foreground/80">
            Crea tu cuenta gratis y publica tu primera vacante en minutos.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link href="/sign-up">
              Crear cuenta gratis <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" /> {APP_NAME}
          </span>
          <span>Reclutamiento con IA, transparente y sin sesgos · LATAM</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
  color,
  bg,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
      <div className={`inline-flex size-11 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  text,
}: {
  n: number;
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="relative rounded-2xl border bg-card p-6">
      <span className="absolute -top-3 left-6 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <Icon className="mt-2 size-6 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
