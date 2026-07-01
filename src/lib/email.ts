/**
 * Envío de correo mediante Resend (API REST, sin dependencias extra).
 * Requiere RESEND_API_KEY. El remitente sale de EMAIL_FROM
 * (por defecto el sandbox de Resend, que solo entrega al dueño de la cuenta).
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('EMAIL_NOT_CONFIGURED');
    this.name = 'EmailNotConfiguredError';
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || 'Talento 360 <onboarding@resend.dev>';
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new EmailNotConfiguredError();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`EMAIL_SEND_FAILED: ${res.status} ${detail.slice(0, 200)}`);
  }
}
