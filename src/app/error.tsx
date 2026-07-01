'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo; si persiste, contáctanos.
      </p>
      <Button onClick={reset} className="mt-6">
        Intentar de nuevo
      </Button>
    </div>
  );
}
