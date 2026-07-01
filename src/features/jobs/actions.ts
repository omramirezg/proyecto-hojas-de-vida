'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { requirePermission } from '@/server/guards';
import { recordAudit } from '@/features/audit/service';
import { type ActionState, toActionError } from '@/lib/action-state';
import { jobBodySchema, criteriaSchema, jobStatusEnum } from './schemas';
import { CRITERIA_DIMENSIONS } from './constants';
import * as repo from './repository';

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

/** Lee un campo oculto con un array JSON de strings (gestionado por ListField). */
function parseList(formData: FormData, key: string): string[] {
  const raw = str(formData, key);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function buildBody(formData: FormData) {
  return {
    title: str(formData, 'title'),
    objective: str(formData, 'objective'),
    functions: parseList(formData, 'functions'),
    responsibilities: parseList(formData, 'responsibilities'),
    education: str(formData, 'education'),
    experience: str(formData, 'experience'),
    experienceYears: str(formData, 'experienceYears'),
    technicalSkills: parseList(formData, 'technicalSkills'),
    softSkills: parseList(formData, 'softSkills'),
    languages: parseList(formData, 'languages'),
    certifications: parseList(formData, 'certifications'),
    location: str(formData, 'location'),
    workMode: str(formData, 'workMode'),
    salaryMin: str(formData, 'salaryMin'),
    salaryMax: str(formData, 'salaryMax'),
    salaryCurrency: str(formData, 'salaryCurrency'),
  };
}

function buildCriteria(formData: FormData) {
  return CRITERIA_DIMENSIONS.map((d) => ({
    dimension: d.dimension,
    weight: str(formData, `weight.${d.dimension}`) || '0',
  }));
}

function validate(formData: FormData) {
  const body = jobBodySchema.safeParse(buildBody(formData));
  const criteria = criteriaSchema.safeParse(buildCriteria(formData));

  if (!body.success || !criteria.success) {
    const fieldErrors = body.success ? {} : body.error.flatten().fieldErrors;
    const criteriaMsg = criteria.success ? undefined : criteria.error.issues[0]?.message;
    const state: ActionState = {
      ok: false,
      fieldErrors,
      message: criteriaMsg,
    };
    return { ok: false as const, state };
  }
  return { ok: true as const, body: body.data, criteria: criteria.data };
}

// ── Crear vacante ───────────────────────────────────────────────
export async function createJobAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let jobId: string;
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'job:manage');

    const result = validate(formData);
    if (!result.ok) return result.state;

    const job = await repo.createJob(companyId, result.body, result.criteria);
    jobId = job.id;

    await recordAudit({
      action: 'job.created',
      actorId: user.id,
      companyId,
      entityType: 'Job',
      entityId: job.id,
      metadata: { title: job.title },
    });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath(`/empresas/${companyId}/vacantes`);
  redirect(`/empresas/${companyId}/vacantes/${jobId}`);
}

// ── Editar vacante ──────────────────────────────────────────────
export async function updateJobAction(
  companyId: string,
  jobId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    await requirePermission(companyId, 'job:manage');

    const result = validate(formData);
    if (!result.ok) return result.state;

    await repo.updateJob(companyId, jobId, result.body, result.criteria);

    await recordAudit({
      action: 'job.updated',
      actorId: user.id,
      companyId,
      entityType: 'Job',
      entityId: jobId,
    });

    revalidatePath(`/empresas/${companyId}/vacantes/${jobId}`);
    return { ok: true, message: 'Vacante actualizada correctamente.' };
  } catch (error) {
    return toActionError(error);
  }
}

// ── Cambiar estado (publicar / cerrar / archivar) ───────────────
export async function changeJobStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { user } = await requireSession();
    const companyId = str(formData, 'companyId');
    const jobId = str(formData, 'jobId');
    const parsedStatus = jobStatusEnum.safeParse(str(formData, 'status'));
    if (!companyId || !jobId || !parsedStatus.success) {
      return { ok: false, message: 'Datos inválidos.' };
    }

    await requirePermission(companyId, 'job:manage');
    await repo.changeJobStatus(companyId, jobId, parsedStatus.data);

    await recordAudit({
      action: 'job.status_changed',
      actorId: user.id,
      companyId,
      entityType: 'Job',
      entityId: jobId,
      metadata: { status: parsedStatus.data },
    });

    revalidatePath(`/empresas/${companyId}/vacantes/${jobId}`);
    revalidatePath(`/empresas/${companyId}/vacantes`);
    return { ok: true, message: 'Estado actualizado.' };
  } catch (error) {
    return toActionError(error);
  }
}
