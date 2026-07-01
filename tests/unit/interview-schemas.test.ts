import { describe, it, expect } from 'vitest';
import {
  scheduleInterviewSchema,
  hiringDecisionSchema,
} from '@/features/interviews/schemas';

describe('scheduleInterviewSchema', () => {
  it('acepta una fecha/hora válida y modalidad', () => {
    const r = scheduleInterviewSchema.safeParse({
      applicationId: 'a1',
      scheduledAt: '2026-07-01T10:30',
      mode: 'REMOTE',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.scheduledAt instanceof Date).toBe(true);
  });

  it('rechaza una fecha inválida', () => {
    const r = scheduleInterviewSchema.safeParse({
      applicationId: 'a1',
      scheduledAt: 'no-es-fecha',
      mode: 'REMOTE',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza una modalidad inválida', () => {
    const r = scheduleInterviewSchema.safeParse({
      applicationId: 'a1',
      scheduledAt: '2026-07-01T10:30',
      mode: 'CHAT',
    });
    expect(r.success).toBe(false);
  });
});

describe('hiringDecisionSchema', () => {
  it('acepta SELECTED y REJECTED', () => {
    expect(
      hiringDecisionSchema.safeParse({ applicationId: 'a1', decision: 'SELECTED' }).success,
    ).toBe(true);
    expect(
      hiringDecisionSchema.safeParse({ applicationId: 'a1', decision: 'REJECTED' }).success,
    ).toBe(true);
  });

  it('rechaza decisiones desconocidas', () => {
    expect(
      hiringDecisionSchema.safeParse({ applicationId: 'a1', decision: 'MAYBE' }).success,
    ).toBe(false);
  });
});
