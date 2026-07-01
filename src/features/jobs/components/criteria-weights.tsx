'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CRITERIA_DIMENSIONS } from '../constants';
import type { CriteriaDimension } from '@prisma/client';

/**
 * Editor de pesos ponderados por dimensión. Muestra la suma en vivo y avisa
 * cuando no es exactamente 100% (la validación final también ocurre en el servidor).
 */
export function CriteriaWeights({
  defaultWeights,
}: {
  defaultWeights?: Partial<Record<CriteriaDimension, number>>;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      CRITERIA_DIMENSIONS.map((d) => [
        d.dimension,
        defaultWeights?.[d.dimension] ?? d.defaultWeight,
      ]),
    ),
  );

  const total = useMemo(
    () => Object.values(weights).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0),
    [weights],
  );
  const isValid = total === 100;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {CRITERIA_DIMENSIONS.map((d) => (
          <div
            key={d.dimension}
            className="flex items-center justify-between gap-4 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{d.label}</p>
              <p className="text-xs text-muted-foreground">{d.hint}</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                name={`weight.${d.dimension}`}
                value={weights[d.dimension] ?? 0}
                onChange={(e) =>
                  setWeights((prev) => ({
                    ...prev,
                    [d.dimension]: e.target.value === '' ? 0 : Number(e.target.value),
                  }))
                }
                className="w-20 text-right"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          'flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium',
          isValid
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-warning/40 bg-warning/10 text-warning',
        )}
      >
        <span className="flex items-center gap-2">
          {isValid ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {isValid ? 'Los pesos suman 100%' : 'Los pesos deben sumar 100%'}
        </span>
        <span>Total: {total}%</span>
      </div>
    </div>
  );
}
