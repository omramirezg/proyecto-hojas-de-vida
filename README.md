# Angélica — Reclutamiento con IA para LATAM

SaaS B2B multi-tenant de reclutamiento y selección de personal con IA: reclutamiento ciego,
Índice de Ajuste al Cargo (IAC) explicable y ranking inteligente de candidatos.

## Stack

- **Next.js 14 (App Router) + React + TypeScript** (strict)
- **Tailwind CSS** + componentes estilo shadcn/ui
- **Prisma** + **PostgreSQL (Supabase)**
- **Clerk** (autenticación + organizaciones)
- **Supabase Storage** (archivos, desde Fase 4)
- **OpenAI** (procesamiento de CV e IAC, desde Fase 5)
- Calidad: ESLint, Prettier, Vitest

## Puesta en marcha (Fase 1)

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Completa:
   - `DATABASE_URL` y `DIRECT_URL` → crea un proyecto en [supabase.com](https://supabase.com), copia las cadenas de conexión (Settings → Database). Usa la *pooled* (6543) para `DATABASE_URL` y la *direct* (5432) para `DIRECT_URL`.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` → crea una app en [clerk.com](https://clerk.com).

3. **Crear las tablas**
   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed   # opcional: empresa demo
   ```

4. **Levantar el servidor**
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000

5. **Sincronizar usuarios (webhook de Clerk)** — opcional en local
   - En el Dashboard de Clerk → Webhooks → crea un endpoint a `https://TU-URL/api/webhooks/clerk` con los eventos `user.created`, `user.updated`, `user.deleted`.
   - Copia el *Signing Secret* a `CLERK_WEBHOOK_SECRET`.
   - En local puedes exponer el puerto con `ngrok` o probar el alta vía el *provisioning just-in-time* (al iniciar sesión, el usuario se crea solo).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera Prisma Client) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run format` | Prettier |
| `npm run test` | Pruebas con Vitest |
| `npm run prisma:migrate` | Migraciones de desarrollo |
| `npm run prisma:studio` | Explorador de la base de datos |

## Roles (Fase 1)

- **Superadmin** (global, `User.isPlatformAdmin`)
- **Admin de empresa**, **Reclutador**, **Evaluador**, **Candidato** (por empresa, `CompanyMember.role`)

## Estado del proyecto

- [x] **Fase 1** — Autenticación, usuarios, roles, protección de rutas, layout privado, dashboard inicial.
- [x] **Fase 2** — Empresas: crear/editar, perfil, sector/tamaño/país/logo, miembros e invitaciones con flujo de aceptación.
- [x] **Fase 3** — Vacantes y análisis del cargo: CRUD, estados, criterios ponderados (validación 100%), publicación interna.
- [x] **Fase 4** — Candidatos y carga de CV: registro, subida a Supabase Storage (validación tipo/tamaño), postulación a vacantes y estados del proceso.
- [x] **Fase 5** — Procesamiento de CV con IA: extracción PDF/DOCX, estandarización (OpenAI con fallback heurístico), separación visible/sesgante y revelado auditado.
- [x] **Fase 6** — Motor IAC determinista + ranking ciego, explicación automática, categorías, fortalezas/debilidades/riesgos y auditoría del cálculo.
- [x] **Fase 7** — Evaluaciones técnicas/blandas: catálogo, asignación a vacantes, registro de resultados e incorporación al IAC + historial.
- [x] **Fase 8** — Dashboard con métricas reales: vacantes activas, candidatos, entrevistas, contrataciones, estado de procesos y ranking por vacante.
- [x] **Fase 9** — Entrevistas y contratación: programar entrevistas, observaciones, seleccionar/descartar y resumen del proceso por postulación.
- [x] **Fase 10** — QA, seguridad y producción: validación de entorno, magic bytes, matriz de permisos, UI de error/carga/404, healthcheck y checklists ([DEPLOYMENT.md](DEPLOYMENT.md)).

**Proyecto MVP completo (10/10 fases).** `npm run ci` ejecuta typecheck + lint + 86 tests.

## Configuración de Supabase Storage (Fase 4)

1. En el panel de Supabase → **Storage** → crea un bucket **privado** llamado `resumes`
   (o el nombre que pongas en `SUPABASE_STORAGE_BUCKET`).
2. Copia en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → **service_role**, ¡solo server-side!)
3. Las descargas usan URLs firmadas de 60 s a través de `/api/empresas/[companyId]/cv/[resumeId]`,
   que re-verifica permisos en cada acceso. No expongas el bucket como público.
