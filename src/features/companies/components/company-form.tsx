'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { COMPANY_SECTORS, COMPANY_SIZES, LATAM_COUNTRIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/shared/field-error';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

interface CompanyDefaults {
  id?: string;
  name?: string | null;
  sector?: string | null;
  size?: string | null;
  country?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : label}
    </Button>
  );
}

export function CompanyForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: CompanyDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      {defaults?.id ? <input type="hidden" name="companyId" value={defaults.id} /> : null}

      <div>
        <Label htmlFor="name">Nombre de la empresa *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaults?.name ?? ''}
          placeholder="Mi Startup S.A.S."
          required
          className="mt-1.5"
        />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="sector">Sector</Label>
          <Select id="sector" name="sector" defaultValue={defaults?.sector ?? ''} className="mt-1.5">
            <option value="">Selecciona…</option>
            {COMPANY_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.sector} />
        </div>

        <div>
          <Label htmlFor="size">Tamaño</Label>
          <Select id="size" name="size" defaultValue={defaults?.size ?? ''} className="mt-1.5">
            <option value="">Selecciona…</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.size} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="country">País</Label>
          <Select id="country" name="country" defaultValue={defaults?.country ?? ''} className="mt-1.5">
            <option value="">Selecciona…</option>
            {LATAM_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.country} />
        </div>

        <div>
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={defaults?.website ?? ''}
            placeholder="https://miempresa.com"
            className="mt-1.5"
          />
          <FieldError errors={state.fieldErrors?.website} />
        </div>
      </div>

      <div>
        <Label htmlFor="logoUrl">Logo (URL)</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={defaults?.logoUrl ?? ''}
          placeholder="https://…/logo.png"
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Por ahora usa una URL pública. La subida de archivos a Supabase Storage llega en la Fase 4.
        </p>
        <FieldError errors={state.fieldErrors?.logoUrl} />
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
