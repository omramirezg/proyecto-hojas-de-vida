import { z } from 'zod';
import { optionalText } from '@/lib/zod-helpers';

export const interviewModeEnum = z.enum(['REMOTE', 'ONSITE', 'PHONE']);
export const interviewStatusEnum = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW']);
export const hiringOutcomeEnum = z.enum(['SELECTED', 'REJECTED']);

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: 'Fecha y hora inválidas.' }) }),
  mode: interviewModeEnum,
  location: optionalText,
  notes: optionalText,
});

export const updateInterviewSchema = z.object({
  interviewId: z.string().min(1),
  status: interviewStatusEnum,
  notes: optionalText,
});

export const hiringDecisionSchema = z.object({
  applicationId: z.string().min(1),
  decision: hiringOutcomeEnum,
  reason: optionalText,
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
