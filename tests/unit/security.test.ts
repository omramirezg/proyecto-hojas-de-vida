import { describe, it, expect } from 'vitest';
import { sniffResumeType, validateResumeMagicBytes } from '@/features/candidates/file-validation';
import { checkEnv } from '@/lib/env';

describe('magic bytes de CV', () => {
  it('reconoce un PDF por su firma %PDF', () => {
    const pdf = Buffer.from('%PDF-1.7\n...', 'ascii');
    expect(sniffResumeType(pdf)).toBe('pdf');
    expect(validateResumeMagicBytes(pdf).ok).toBe(true);
  });

  it('reconoce un .docx (ZIP) por su firma PK', () => {
    const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(sniffResumeType(docx)).toBe('office-zip');
    expect(validateResumeMagicBytes(docx).ok).toBe(true);
  });

  it('rechaza un PNG disfrazado de PDF', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(sniffResumeType(png)).toBe('unknown');
    expect(validateResumeMagicBytes(png).ok).toBe(false);
  });
});

describe('validación de entorno', () => {
  it('detecta variables críticas faltantes', () => {
    const report = checkEnv({});
    expect(report.database).toBe(false);
    expect(report.auth).toBe(false);
    expect(report.missingCritical.length).toBeGreaterThan(0);
  });

  it('reporta configuración completa cuando están todas', () => {
    const report = checkEnv({
      DATABASE_URL: 'postgres://x',
      DIRECT_URL: 'postgres://x',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk',
      CLERK_SECRET_KEY: 'sk',
      NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'srv',
      OPENAI_API_KEY: 'sk-openai',
    });
    expect(report.database).toBe(true);
    expect(report.auth).toBe(true);
    expect(report.storage).toBe(true);
    expect(report.ai).toBe(true);
    expect(report.missingCritical).toEqual([]);
  });

  it('marca storage y ai como opcionales (no críticos)', () => {
    const report = checkEnv({
      DATABASE_URL: 'postgres://x',
      DIRECT_URL: 'postgres://x',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk',
      CLERK_SECRET_KEY: 'sk',
    });
    expect(report.missingCritical).toEqual([]);
    expect(report.storage).toBe(false);
    expect(report.ai).toBe(false);
  });
});
