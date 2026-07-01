import { INTERVIEW_MODE_LABELS } from './constants';
import { APP_NAME } from '@/lib/brand';
import type { InterviewMode } from '@prisma/client';

export interface InterviewEmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  mode: InterviewMode;
  location?: string | null;
  notes?: string | null;
}

/** Construye el asunto y HTML del correo de citación a entrevista. */
export function composeInterviewEmail(data: InterviewEmailData): {
  subject: string;
  html: string;
} {
  const fecha = new Intl.DateTimeFormat('es', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(data.scheduledAt);

  const subject = `Invitación a entrevista — ${data.jobTitle} (${data.companyName})`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <div style="background:#4338ca; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
      <h1 style="margin:0; font-size:18px;">${data.companyName}</h1>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      <p>Hola <strong>${data.candidateName}</strong>,</p>
      <p>Nos complace invitarte a una entrevista para la vacante
        <strong>${data.jobTitle}</strong>.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr>
          <td style="padding:8px 0; color:#6b7280;">Fecha y hora</td>
          <td style="padding:8px 0; text-align:right;"><strong>${fecha}</strong></td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#6b7280;">Modalidad</td>
          <td style="padding:8px 0; text-align:right;">${INTERVIEW_MODE_LABELS[data.mode]}</td>
        </tr>
        ${
          data.location
            ? `<tr><td style="padding:8px 0; color:#6b7280;">Lugar / enlace</td>
                 <td style="padding:8px 0; text-align:right;">${escapeHtml(data.location)}</td></tr>`
            : ''
        }
      </table>
      ${data.notes ? `<p style="color:#374151;">${escapeHtml(data.notes)}</p>` : ''}
      <p>Por favor confirma tu asistencia respondiendo a este correo.</p>
      <p style="margin-top:24px; color:#6b7280;">Un saludo,<br/>Equipo de selección de ${data.companyName}</p>
    </div>
    <p style="text-align:center; color:#9ca3af; font-size:12px; margin-top:16px;">
      Enviado con ${APP_NAME}
    </p>
  </div>`;

  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
