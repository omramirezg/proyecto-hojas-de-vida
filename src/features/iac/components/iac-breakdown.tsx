import { CRITERIA_DIMENSIONS } from '@/features/jobs/constants';
import { cn } from '@/lib/utils';
import type { CriteriaDimension } from '@prisma/client';

const LABELS = new Map(CRITERIA_DIMENSIONS.map((d) => [d.dimension, d.label]));

interface DetailRow {
  dimension: CriteriaDimension;
  weight: number;
  rawScore: number;
  applicable: boolean;
  note: string | null;
}

function barColor(score: number): string {
  if (score >= 75) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-destructive';
}

/** Desglose por dimensión del IAC (transparencia: muestra peso, puntaje y nota). */
export function IacBreakdown({ details }: { details: DetailRow[] }) {
  if (details.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin desglose disponible.</p>;
  }

  return (
    <ul className="space-y-3">
      {details.map((d) => (
        <li key={d.dimension}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {LABELS.get(d.dimension) ?? d.dimension}
              <span className="ml-2 text-xs text-muted-foreground">peso {d.weight}%</span>
            </span>
            <span className={cn('text-sm font-semibold', !d.applicable && 'text-muted-foreground')}>
              {d.applicable ? `${d.rawScore}/100` : 'N/A'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full', d.applicable ? barColor(d.rawScore) : 'bg-muted')}
              style={{ width: `${d.applicable ? d.rawScore : 0}%` }}
            />
          </div>
          {d.note ? <p className="mt-1 text-xs text-muted-foreground">{d.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}
