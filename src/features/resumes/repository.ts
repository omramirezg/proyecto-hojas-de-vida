import { db } from '@/lib/db';
import type { ParsedVisible, ParsedHidden } from '@/lib/ai';
import type { Prisma, ResumeStatus } from '@prisma/client';

/** Acceso a datos del CV estandarizado y los datos ocultos. */

export async function setResumeStatus(
  companyId: string,
  resumeId: string,
  status: ResumeStatus,
  extra?: { extractedText?: string | null; errorMessage?: string | null },
) {
  return db.resumeFile.updateMany({
    where: { id: resumeId, companyId },
    data: {
      status,
      extractedText: extra?.extractedText,
      errorMessage: extra?.errorMessage,
    },
  });
}

export async function upsertStandardizedResume(params: {
  companyId: string;
  candidateId: string;
  resumeFileId: string;
  parserName: string;
  visible: ParsedVisible;
  raw: Prisma.InputJsonValue;
}) {
  const { companyId, candidateId, resumeFileId, parserName, visible } = params;
  const data = {
    companyId,
    resumeFileId,
    parserName,
    summary: visible.summary ?? null,
    yearsExperience: visible.yearsExperience ?? null,
    technicalSkills: visible.technicalSkills,
    softSkills: visible.softSkills,
    languages: visible.languages as unknown as Prisma.InputJsonValue,
    certifications: visible.certifications,
    educationLevel: visible.educationLevel ?? null,
    degrees: visible.degrees,
    positions: visible.positions as unknown as Prisma.InputJsonValue,
    locationCity: visible.locationCity ?? null,
    locationCountry: visible.locationCountry ?? null,
    raw: params.raw,
  };

  return db.standardizedResume.upsert({
    where: { candidateId },
    update: data,
    create: { candidateId, ...data },
  });
}

export async function upsertHiddenData(params: {
  companyId: string;
  candidateId: string;
  resumeFileId: string;
  hidden: ParsedHidden;
}) {
  const { companyId, candidateId, resumeFileId, hidden } = params;
  const data = {
    companyId,
    resumeFileId,
    fullName: hidden.fullName ?? null,
    hasPhoto: hidden.hasPhoto,
    age: hidden.age ?? null,
    gender: hidden.gender ?? null,
    institutions: hidden.institutions,
    specificAddress: hidden.specificAddress ?? null,
  };

  return db.hiddenCandidateData.upsert({
    where: { candidateId },
    update: data,
    create: { candidateId, ...data },
  });
}

export async function getStandardizedResume(companyId: string, candidateId: string) {
  return db.standardizedResume.findFirst({ where: { candidateId, companyId } });
}

/** Datos sesgantes: SOLO se debe llamar tras verificar candidate:reveal + auditar. */
export async function getHiddenData(companyId: string, candidateId: string) {
  return db.hiddenCandidateData.findFirst({ where: { candidateId, companyId } });
}
