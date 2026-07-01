/**
 * Contrato estándar de retorno para Server Actions usadas con `useActionState`.
 * Mantiene un formato uniforme para mostrar éxito, errores globales y por campo.
 */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialActionState: ActionState = { ok: false };

/** Traduce errores conocidos de autorización a mensajes en español para el usuario. */
export function toActionError(error: unknown): ActionState {
  const code = error instanceof Error ? error.message : 'UNKNOWN';
  const messages: Record<string, string> = {
    UNAUTHENTICATED: 'Tu sesión expiró. Inicia sesión de nuevo.',
    NOT_A_MEMBER: 'No perteneces a esta empresa.',
    FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  };
  return { ok: false, message: messages[code] ?? 'Ocurrió un error. Inténtalo de nuevo.' };
}
