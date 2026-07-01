'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Campo de lista editable (chips). Serializa el array a un input oculto como JSON,
 * compatible con Server Actions vía FormData.
 */
export function ListField({
  name,
  label,
  hint,
  placeholder,
  defaultValue = [],
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  defaultValue?: string[];
}) {
  const [items, setItems] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value || items.includes(value)) {
      setDraft('');
      return;
    }
    setItems((prev) => [...prev, value]);
    setDraft('');
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Label htmlFor={`${name}-input`}>{label}</Label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <input type="hidden" name={name} value={JSON.stringify(items)} readOnly />

      <div className="mt-1.5 flex gap-2">
        <Input
          id={`${name}-input`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="icon" onClick={add} aria-label="Agregar">
          <Plus className="size-4" />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Badge key={`${item}-${i}`} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-full p-0.5 hover:bg-background/60"
                aria-label={`Quitar ${item}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
