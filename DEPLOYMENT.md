# Despliegue y producción — Angélica

Guía y checklists para llevar la plataforma a producción de forma segura.

## Arquitectura de despliegue

```
GitHub (repo privado)
   │  push / PR
   ▼
Vercel (Next.js: SSR + Server Actions + Route Handlers)
   │
   ├── Supabase PostgreSQL (Prisma)   ← datos (multi-tenant + RLS)
   ├── Supabase Storage (bucket privado "resumes")  ← CVs
   ├── Clerk  ← autenticación + organizaciones
   └── OpenAI ← estandarización de CV (opcional)
```

## Comando de verificación previa

```bash
npm run ci   # prisma generate + typecheck + lint + tests
```

Monitoreo: `GET /api/health` → `{ status, checks }` (sin datos sensibles).

---

## ✅ Checklist de producción

- [ ] `npm run ci` en verde (typecheck, lint, 60+ tests).
- [ ] Variables de entorno cargadas en Vercel (Production y Preview).
- [ ] `assertCriticalEnv()` no reporta faltantes (`/api/health` = `ok`).
- [ ] Migraciones aplicadas: `prisma migrate deploy`.
- [ ] Secretos del lado servidor NUNCA con prefijo `NEXT_PUBLIC_`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` y `OPENAI_API_KEY` solo en el servidor.
- [ ] Webhook de Clerk configurado y verificando firma (`svix`).
- [ ] Dominio propio + HTTPS forzado.
- [ ] Páginas de error y estados de carga revisados.
- [ ] Límite de tamaño de archivo (`MAX_FILE_SIZE_MB`) acorde al plan de Vercel.
- [ ] Backups de base de datos activados.
- [ ] Revisión de logs de auditoría (`AuditLog`) funcionando.

## ✅ Checklist de despliegue en Vercel

- [ ] Proyecto conectado al repo de GitHub.
- [ ] Build command: `npm run build` (incluye `prisma generate`).
- [ ] Node 20+ en el proyecto.
- [ ] Variables de entorno en **Production** y **Preview** por separado.
- [ ] `DATABASE_URL` = cadena *pooled* (puerto 6543, `pgbouncer=true`).
- [ ] `DIRECT_URL` = cadena *directa* (puerto 5432) para migraciones.
- [ ] Función de Server Actions con `bodySizeLimit` suficiente para CVs.
- [ ] Revisar duración máxima de funciones; mover procesamiento de CV a cola
      (Inngest/Trigger.dev) si los CV grandes superan el límite.
- [ ] Preview deployments protegidos (no exponen datos reales).
- [ ] Alertas de gasto configuradas.

## ✅ Checklist de base de datos en Supabase

- [ ] Proyecto creado en la región más cercana a LATAM (p. ej. São Paulo).
- [ ] `prisma migrate deploy` ejecutado; esquema al día.
- [ ] **Row Level Security (RLS)** habilitado en tablas con datos de tenant
      como segunda muralla (la app ya filtra por `companyId`).
- [ ] Política: cada fila accesible solo por miembros de su `companyId`.
- [ ] Pooling (pgbouncer) activo para serverless.
- [ ] Backups automáticos + prueba de restauración.
- [ ] Acceso a la base restringido (sin `0.0.0.0/0` salvo lo necesario).
- [ ] Índices presentes (ya definidos en el esquema) para queries de ranking.

## ✅ Checklist de Storage

- [ ] Bucket `resumes` creado como **privado** (no público).
- [ ] Subidas solo desde el servidor con `service_role` (nunca desde el cliente).
- [ ] Descargas siempre vía `/api/empresas/[companyId]/cv/[resumeId]`
      (re-verifica permisos + URL firmada de 60 s).
- [ ] Validación de tipo (MIME + extensión) y de **magic bytes** activa.
- [ ] Límite de tamaño aplicado server-side.
- [ ] Política de retención/eliminación de archivos definida.
- [ ] (Opcional) Escaneo antivirus de archivos subidos.

## ✅ Checklist de privacidad de datos (Habeas Data LATAM / GDPR)

- [ ] **Reclutamiento ciego**: datos sesgantes (`HiddenCandidateData`) separados
      y nunca enviados al cliente ni al prompt de IA en etapas ciegas.
- [ ] Revelar identidad requiere permiso `candidate:reveal` y queda **auditado**.
- [ ] IAC determinista y explicable; nunca usa género/edad/origen como variable.
- [ ] Consentimiento explícito del candidato para tratar su CV.
- [ ] Política de privacidad y finalidad del tratamiento publicadas.
- [ ] Derecho de acceso, rectificación y **eliminación** (soft delete + purga).
- [ ] Minimización: solo se extrae lo necesario para el proceso.
- [ ] Cifrado en tránsito (HTTPS) y en reposo (Supabase por defecto).
- [ ] Registro de accesos sensibles en `AuditLog`.
- [ ] Acuerdo de tratamiento de datos con proveedores (Supabase, Clerk, OpenAI).
- [ ] Residencia de datos acorde a la normativa del país objetivo.

---

## Controles de seguridad ya implementados

| Control | Dónde |
|---|---|
| Aislamiento multi-tenant (filtro `companyId`) | `server/guards.ts`, repositorios |
| Control de acceso por rol (mínimo privilegio) | `lib/roles.ts` + matriz de tests |
| Protección de rutas privadas | `middleware.ts` + verificación server |
| Validación server-side (Zod) | `features/*/schemas.ts` |
| Validación de archivos (tipo, tamaño, magic bytes) | `features/candidates/file-validation.ts` |
| Descarga de CV con URL firmada + re-check | `api/empresas/.../cv/[resumeId]` |
| Separación de datos sesgantes | `HiddenCandidateData` + `candidate:reveal` |
| IAC determinista y auditable | `features/iac/engine.ts` |
| Firma de webhooks | `api/webhooks/clerk` (svix) |
| Auditoría de acciones sensibles | `features/audit` + `AuditLog` |
| Manejo seguro de secretos | `lib/env.ts`, sin `NEXT_PUBLIC_` en secretos |

## Mejoras recomendadas a futuro (post-MVP)

- Cola asíncrona para procesamiento de CV (Inngest / Trigger.dev).
- Rate limiting en Server Actions y subidas.
- Envío de invitaciones y notificaciones por email (Resend / Postmark).
- Pruebas de integración con base de datos efímera (Testcontainers / Supabase local).
- Selector de empresa activa para usuarios multi-empresa.
- Evaluaciones a nivel de postulación (hoy a nivel candidato).
