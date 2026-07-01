/** Validación server-side de archivos de CV (tipo y tamaño). */

const DEFAULT_ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

const DEFAULT_MAX_MB = 10;

export function allowedMimeTypes(): string[] {
  const fromEnv = process.env.ALLOWED_FILE_TYPES?.split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_MIME;
}

export function maxFileBytes(): number {
  const mb = Number(process.env.MAX_FILE_SIZE_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MAX_MB) * 1024 * 1024;
}

export interface FileMeta {
  name: string;
  type: string;
  size: number;
}

export type FileValidationResult = { ok: true } | { ok: false; error: string };

export function validateResumeFile(file: FileMeta): FileValidationResult {
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' };

  const max = maxFileBytes();
  if (file.size > max) {
    return {
      ok: false,
      error: `El archivo supera el tamaño máximo (${Math.round(max / (1024 * 1024))} MB).`,
    };
  }

  const allowed = allowedMimeTypes();
  // Algunos navegadores no envían MIME para .doc/.docx: validar también por extensión.
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  const extOk = ['pdf', 'doc', 'docx'].includes(ext);
  const mimeOk = allowed.includes(file.type);

  if (!mimeOk && !extOk) {
    return { ok: false, error: 'Formato no permitido. Usa PDF o Word (.pdf, .doc, .docx).' };
  }
  return { ok: true };
}

/**
 * Verificación profunda por "magic bytes": confirma que el contenido real del
 * archivo corresponde a un PDF / Office, evitando archivos disfrazados por extensión.
 * - PDF:  25 50 44 46  ("%PDF")
 * - DOCX/ZIP: 50 4B 03 04 ("PK..")  (los .docx son ZIP)
 * - DOC (OLE2): D0 CF 11 E0 A1 B1 1A E1
 */
export function sniffResumeType(buffer: Buffer): 'pdf' | 'office-zip' | 'doc' | 'unknown' {
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF') return 'pdf';
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)
    return 'office-zip';
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  )
    return 'doc';
  return 'unknown';
}

export function validateResumeMagicBytes(buffer: Buffer): FileValidationResult {
  const kind = sniffResumeType(buffer);
  if (kind === 'unknown') {
    return {
      ok: false,
      error: 'El contenido del archivo no parece un PDF ni un documento de Word válido.',
    };
  }
  return { ok: true };
}
