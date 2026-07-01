import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileText, Download, Mail, Phone, ShieldAlert, Lock, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { getCandidate, listSelectableJobs } from '@/features/candidates/repository';
import { getStandardizedResume, getHiddenData } from '@/features/resumes/repository';
import {
  uploadResumeAction,
  applyToJobAction,
  changeApplicationStatusAction,
} from '@/features/candidates/actions';
import { processResumeAction, revealIdentityAction } from '@/features/resumes/actions';
import {
  CANDIDATE_SOURCE_LABELS,
  RESUME_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_BADGE,
} from '@/features/candidates/constants';
import { UploadResumeForm } from '@/features/candidates/components/upload-resume-form';
import { ApplyToJobForm } from '@/features/candidates/components/apply-to-job-form';
import { ApplicationStatusSelect } from '@/features/candidates/components/application-status-select';
import { ProcessResumeButton } from '@/features/resumes/components/process-resume-button';
import { RevealIdentityButton } from '@/features/resumes/components/reveal-identity-button';
import { ComputeIacButton } from '@/features/iac/components/compute-iac-button';
import { computeIacAction } from '@/features/iac/actions';
import { IAC_CATEGORY_LABELS, IAC_CATEGORY_BADGE } from '@/features/iac/constants';
import {
  listCandidateResults,
  listEvaluations,
  listGeneratedEvaluations,
  listAssignmentsForCandidate,
} from '@/features/evaluations/repository';
import { recordResultAction, assignEvaluationToCandidateAction } from '@/features/evaluations/actions';
import { RecordResultForm } from '@/features/evaluations/components/record-result-form';
import { AssignTestPanel } from '@/features/evaluations/components/assign-test-panel';
import { EVALUATION_TYPE_LABELS } from '@/features/evaluations/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ResumeStatus } from '@prisma/client';

export const metadata: Metadata = { title: 'Candidato' };

const RESUME_BADGE: Record<ResumeStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  UPLOADED: 'secondary',
  PROCESSING: 'warning',
  PROCESSED: 'success',
  FAILED: 'destructive',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; candidateId: string }>;
  searchParams: Promise<{ revelar?: string }>;
}) {
  const { companyId, candidateId } = await params;
  const { revelar } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const membership = session.memberships.find(
    (m) => m.companyId === companyId && m.status === 'ACTIVE',
  );
  if (!membership) notFound();
  if (!hasPermission(membership.role, 'candidate:manage')) {
    redirect(`/empresas/${companyId}/candidatos`);
  }

  const candidate = await getCandidate(companyId, candidateId);
  if (!candidate) notFound();

  const standardized = await getStandardizedResume(companyId, candidateId);

  const canReveal = hasPermission(membership.role, 'candidate:reveal');
  const showHidden = canReveal && revelar === '1';
  const hidden = showHidden ? await getHiddenData(companyId, candidateId) : null;

  const appliedJobIds = new Set(candidate.applications.map((a) => a.jobId));
  const allJobs = await listSelectableJobs(companyId);
  const availableJobs = allJobs.filter((j) => !appliedJobIds.has(j.id));

  const canGrade = hasPermission(membership.role, 'evaluation:grade');
  const [evalResults, evalCatalog, generatedEvals, assignments] = await Promise.all([
    listCandidateResults(companyId, candidateId),
    canGrade ? listEvaluations(companyId) : Promise.resolve([]),
    canGrade ? listGeneratedEvaluations(companyId) : Promise.resolve([]),
    canGrade ? listAssignmentsForCandidate(companyId, candidateId) : Promise.resolve([]),
  ]);
  const assignAction = assignEvaluationToCandidateAction.bind(null, companyId, candidateId);

  const uploadAction = uploadResumeAction.bind(null, companyId, candidateId);
  const applyAction = applyToJobAction.bind(null, companyId);
  const statusAction = changeApplicationStatusAction.bind(null, companyId, candidateId);
  const revealAction = revealIdentityAction.bind(null, companyId, candidateId);
  const recordAction = recordResultAction.bind(null, companyId, candidateId);

  const languages = Array.isArray(standardized?.languages)
    ? (standardized.languages as { language: string; level?: string | null }[])
    : [];
  const positions = Array.isArray(standardized?.positions)
    ? (standardized.positions as { title: string; org?: string | null; years?: number | null }[])
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/empresas/${companyId}/candidatos`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a candidatos
      </Link>

      {/* Datos del candidato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{candidate.fullName}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {candidate.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" /> {candidate.email}
              </span>
            ) : null}
            {candidate.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {candidate.phone}
              </span>
            ) : null}
            <Badge variant="outline">{CANDIDATE_SOURCE_LABELS[candidate.source]}</Badge>
          </div>
        </CardHeader>
        {candidate.notes ? (
          <CardContent>
            <p className="whitespace-pre-line text-sm">{candidate.notes}</p>
          </CardContent>
        ) : null}
      </Card>

      {/* Hojas de vida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" /> Hojas de vida ({candidate.resumeFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.resumeFiles.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {candidate.resumeFiles.map((r) => {
                const processAction = processResumeAction.bind(null, companyId, candidateId, r.id);
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.fileName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {formatBytes(r.sizeBytes)} ·
                        <Badge variant={RESUME_BADGE[r.status]} className="align-middle">
                          {RESUME_STATUS_LABELS[r.status]}
                        </Badge>
                      </div>
                      {r.status === 'FAILED' && r.errorMessage ? (
                        <p className="mt-1 text-xs text-destructive">{r.errorMessage}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.status !== 'PROCESSING' ? (
                        <ProcessResumeButton
                          action={processAction}
                          label={r.status === 'PROCESSED' ? 'Reprocesar' : 'Procesar con IA'}
                        />
                      ) : null}
                      <a
                        href={`/api/empresas/${companyId}/cv/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Download className="size-4" /> Descargar
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay CV cargado.</p>
          )}
          <UploadResumeForm action={uploadAction} />
        </CardContent>
      </Card>

      {/* CV estandarizado (datos visibles, no sesgantes) */}
      {standardized ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CV estandarizado</CardTitle>
            <p className="text-xs text-muted-foreground">
              Datos visibles para reclutamiento ciego · procesado con{' '}
              {standardized.parserName === 'openai' ? 'IA (OpenAI)' : 'modo básico'}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Resumen" value={standardized.summary} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Años de experiencia"
                value={standardized.yearsExperience != null ? `${standardized.yearsExperience}` : null}
              />
              <Field
                label="Ubicación"
                value={[standardized.locationCity, standardized.locationCountry]
                  .filter(Boolean)
                  .join(', ') || null}
              />
              <Field label="Nivel educativo" value={standardized.educationLevel} />
            </div>
            <TagBlock label="Habilidades técnicas" items={standardized.technicalSkills} />
            <TagBlock label="Habilidades blandas" items={standardized.softSkills} />
            <TagBlock label="Certificaciones" items={standardized.certifications} />
            <TagBlock label="Títulos" items={standardized.degrees} />
            {languages.length > 0 ? (
              <TagBlock
                label="Idiomas"
                items={languages.map((l) => (l.level ? `${l.language} - ${l.level}` : l.language))}
              />
            ) : null}
            {positions.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Experiencia
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
                  {positions.map((p, i) => (
                    <li key={i}>
                      {p.title}
                      {p.org ? ` · ${p.org}` : ''}
                      {p.years ? ` (${p.years} años)` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Identidad (datos sesgantes) — reclutamiento ciego */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4" /> Identidad y datos sensibles
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Ocultos por defecto para reducir sesgos. Revelarlos queda registrado en auditoría.
          </p>
        </CardHeader>
        <CardContent>
          {!canReveal ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" /> No tienes permiso para revelar datos sensibles.
            </p>
          ) : showHidden ? (
            hidden ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre (del CV)" value={hidden.fullName} />
                <Field label="Edad" value={hidden.age != null ? `${hidden.age}` : null} />
                <Field label="Género" value={hidden.gender} />
                <Field label="¿Incluye foto?" value={hidden.hasPhoto ? 'Sí' : 'No'} />
                <Field label="Dirección" value={hidden.specificAddress} />
                {hidden.institutions.length > 0 ? (
                  <TagBlock label="Instituciones" items={hidden.institutions} />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos sensibles extraídos todavía (procesa un CV primero).
              </p>
            )
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Los datos sensibles están ocultos. Puedes revelarlos cuando lo necesites.
              </p>
              <RevealIdentityButton action={revealAction} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluaciones ({evalResults.length})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Los resultados alimentan la dimensión «evaluaciones» del IAC (recalcula el IAC para
            reflejarlos).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {evalResults.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {evalResults.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.evaluation.title}</span>
                      <Badge variant="outline">{EVALUATION_TYPE_LABELS[r.evaluation.type]}</Badge>
                    </div>
                    {r.notes ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.notes}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {r.score}/{r.maxScore}
                    </div>
                    <Badge variant="secondary">{r.normalizedScore}/100</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin evaluaciones registradas.</p>
          )}

          {canGrade ? (
            <>
              <div>
                <p className="mb-1 text-sm font-medium">Prueba en línea (IA)</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Asigna una prueba generada con IA y envía el enlace al candidato. Se califica sola
                  y alimenta el IAC.
                </p>
                <AssignTestPanel
                  action={assignAction}
                  evaluations={generatedEvals.map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: e.type,
                  }))}
                  assignments={assignments.map((a) => ({
                    id: a.id,
                    token: a.token,
                    status: a.status,
                    evaluationTitle: a.evaluation.title,
                    evaluationType: a.evaluation.type,
                  }))}
                />
              </div>

              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Registrar resultado manual</p>
                <RecordResultForm
                  action={recordAction}
                  evaluations={evalCatalog.map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: e.type,
                    maxScore: e.maxScore,
                  }))}
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Postulaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Postulaciones ({candidate.applications.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.applications.length > 0 ? (
            <ul className="space-y-2">
              {candidate.applications.map((a) => {
                const computeAction = computeIacAction.bind(null, companyId, candidateId, a.id);
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/empresas/${companyId}/vacantes/${a.jobId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {a.job.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={APPLICATION_STATUS_BADGE[a.status]}>
                          {APPLICATION_STATUS_LABELS[a.status]}
                        </Badge>
                        {a.iacScore ? (
                          <Badge variant={IAC_CATEGORY_BADGE[a.iacScore.category]}>
                            IAC {a.iacScore.overall} · {IAC_CATEGORY_LABELS[a.iacScore.category]}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/empresas/${companyId}/postulaciones/${a.id}`}>
                          Proceso <ChevronRight className="size-4" />
                        </Link>
                      </Button>
                      <ComputeIacButton
                        action={computeAction}
                        label={a.iacScore ? 'Recalcular IAC' : 'Calcular IAC'}
                      />
                      <ApplicationStatusSelect
                        action={statusAction}
                        applicationId={a.id}
                        current={a.status}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">El candidato no está postulado a ninguna vacante.</p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Postular a una vacante</p>
            <ApplyToJobForm
              action={applyAction}
              candidateId={candidate.id}
              jobs={availableJobs.map((j) => ({ id: j.id, title: j.title }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm">{value}</p>
    </div>
  );
}

function TagBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
