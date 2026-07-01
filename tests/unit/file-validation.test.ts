import { describe, it, expect } from 'vitest';
import { validateResumeFile } from '@/features/candidates/file-validation';

describe('validateResumeFile', () => {
  it('acepta un PDF válido', () => {
    const r = validateResumeFile({ name: 'cv.pdf', type: 'application/pdf', size: 200_000 });
    expect(r.ok).toBe(true);
  });

  it('acepta un .docx por extensión aunque el MIME venga vacío', () => {
    const r = validateResumeFile({ name: 'hoja-de-vida.docx', type: '', size: 50_000 });
    expect(r.ok).toBe(true);
  });

  it('rechaza una imagen', () => {
    const r = validateResumeFile({ name: 'foto.png', type: 'image/png', size: 10_000 });
    expect(r.ok).toBe(false);
  });

  it('rechaza archivos vacíos', () => {
    const r = validateResumeFile({ name: 'cv.pdf', type: 'application/pdf', size: 0 });
    expect(r.ok).toBe(false);
  });

  it('rechaza archivos que superan el tamaño máximo', () => {
    const r = validateResumeFile({
      name: 'cv.pdf',
      type: 'application/pdf',
      size: 50 * 1024 * 1024,
    });
    expect(r.ok).toBe(false);
  });
});
