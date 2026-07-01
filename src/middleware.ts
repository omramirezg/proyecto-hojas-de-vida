import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Middleware de autenticación.
 *
 * Rutas públicas: landing, sign-in, sign-up, webhooks.
 * Todo lo demás (incluido el grupo (private)) exige sesión; si no la hay,
 * Clerk redirige a /sign-in.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
  '/evaluacion(.*)', // pruebas que responde el candidato sin iniciar sesión
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Salta archivos estáticos e internos de Next, salvo que haya query params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre aplica a rutas de API.
    '/(api|trpc)(.*)',
  ],
};
