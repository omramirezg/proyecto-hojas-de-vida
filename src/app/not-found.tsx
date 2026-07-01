import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        El recurso no existe o no tienes acceso a él.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Ir al panel</Link>
      </Button>
    </div>
  );
}
