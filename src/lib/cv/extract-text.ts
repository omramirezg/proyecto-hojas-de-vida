/**
 * Extracción de texto plano desde archivos de CV.
 * - PDF  → pdf-parse
 * - DOCX → mammoth
 * - DOC  → no soportado (formato binario legacy); se pide PDF/DOCX.
 *
 * Las librerías se importan dinámicamente para no cargarlas en cada request.
 */

export class ExtractionError extends Error {
  constructor(
    public readonly code: 'UNSUPPORTED_FORMAT' | 'EMPTY_TEXT' | 'PARSE_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

function extensionOf(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() ?? '';
}

export async function extractTextFromResume(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const ext = extensionOf(fileName);
  const isPdf = mimeType === 'application/pdf' || ext === 'pdf';
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx';
  const isDoc = mimeType === 'application/msword' || ext === 'doc';

  let text = '';

  try {
    if (isPdf) {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (isDoc) {
      throw new ExtractionError(
        'UNSUPPORTED_FORMAT',
        'El formato .doc (Word legacy) no es compatible con la extracción. Usa PDF o .docx.',
      );
    } else {
      throw new ExtractionError('UNSUPPORTED_FORMAT', 'Formato no compatible para extracción.');
    }
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      'PARSE_FAILED',
      `No se pudo leer el archivo: ${error instanceof Error ? error.message : 'desconocido'}`,
    );
  }

  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (normalized.length < 20) {
    throw new ExtractionError(
      'EMPTY_TEXT',
      'No se encontró texto legible (¿es un PDF escaneado o una imagen?).',
    );
  }
  return normalized;
}
