'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/shared/field-error';
import { ListField } from './list-field';
import { CriteriaWeights } from './criteria-weights';
import { WORK_MODES, CURRENCIES } from '../constants';
import type { CriteriaDimension } from '@prisma/client';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export interface JobDefaults {
  title?: string;
  objective?: string | null;
  functions?: string[];
  responsibilities?: string[];
  education?: string | null;
  experience?: string | null;
  experienceYears?: number | null;
  technicalSkills?: string[];
  softSkills?: string[];
  languages?: string[];
  certifications?: string[];
  location?: string | null;
  workMode?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  weights?: Partial<Record<CriteriaDimension, number>>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? 'Guardando…' : label}
    </Button>
  );
}

export function JobForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: Action;
  defaults?: JobDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Datos generales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Nombre del cargo *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaults.title ?? ''}
              placeholder="Desarrollador Backend Semi Senior"
              required
              className="mt-1.5"
            />
            <FieldError errors={state.fieldErrors?.title} />
          </div>
          <div>
            <Label htmlFor="objective">Objetivo del cargo</Label>
            <Textarea
              id="objective"
              name="objective"
              defaultValue={defaults.objective ?? ''}
              placeholder="¿Para qué existe este cargo? ¿Qué resultado debe lograr?"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Funciones y responsabilidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funciones y responsabilidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListField
            name="functions"
            label="Funciones"
            placeholder="Escribe una función y presiona Enter"
            defaultValue={defaults.functions}
          />
          <ListField
            name="responsibilities"
            label="Responsabilidades"
            placeholder="Escribe una responsabilidad y presiona Enter"
            defaultValue={defaults.responsibilities}
          />
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisitos del cargo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="education">Formación requerida</Label>
              <Input
                id="education"
                name="education"
                defaultValue={defaults.education ?? ''}
                placeholder="Ingeniería de Sistemas o afines"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="experienceYears">Años de experiencia (mín.)</Label>
              <Input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min={0}
                defaultValue={defaults.experienceYears ?? ''}
                placeholder="3"
                className="mt-1.5"
              />
              <FieldError errors={state.fieldErrors?.experienceYears} />
            </div>
          </div>
          <div>
            <Label htmlFor="experience">Experiencia requerida (descripción)</Label>
            <Textarea
              id="experience"
              name="experience"
              defaultValue={defaults.experience ?? ''}
              placeholder="Experiencia liderando APIs en producción, etc."
              className="mt-1.5"
            />
          </div>
          <ListField
            name="technicalSkills"
            label="Habilidades técnicas"
            placeholder="Node.js, PostgreSQL, Docker…"
            defaultValue={defaults.technicalSkills}
          />
          <ListField
            name="softSkills"
            label="Habilidades blandas"
            placeholder="Comunicación, trabajo en equipo…"
            defaultValue={defaults.softSkills}
          />
          <ListField
            name="languages"
            label="Idiomas requeridos"
            hint="Formato sugerido: «Idioma - Nivel», p. ej. «Inglés - B2»."
            placeholder="Inglés - B2"
            defaultValue={defaults.languages}
          />
          <ListField
            name="certifications"
            label="Certificaciones deseadas"
            placeholder="AWS Solutions Architect…"
            defaultValue={defaults.certifications}
          />
        </CardContent>
      </Card>

      {/* Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                name="location"
                defaultValue={defaults.location ?? ''}
                placeholder="Bogotá, Colombia"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="workMode">Modalidad</Label>
              <Select
                id="workMode"
                name="workMode"
                defaultValue={defaults.workMode ?? ''}
                className="mt-1.5"
              >
                <option value="">Selecciona…</option>
                {WORK_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="salaryMin">Salario mínimo</Label>
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                min={0}
                defaultValue={defaults.salaryMin ?? ''}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="salaryMax">Salario máximo</Label>
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                min={0}
                defaultValue={defaults.salaryMax ?? ''}
                className="mt-1.5"
              />
              <FieldError errors={state.fieldErrors?.salaryMax} />
            </div>
            <div>
              <Label htmlFor="salaryCurrency">Moneda</Label>
              <Select
                id="salaryCurrency"
                name="salaryCurrency"
                defaultValue={defaults.salaryCurrency ?? ''}
                className="mt-1.5"
              >
                <option value="">—</option>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criterios ponderados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criterios de evaluación (IAC)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define cuánto pesa cada dimensión en el Índice de Ajuste al Cargo. Deben sumar 100%.
          </p>
        </CardHeader>
        <CardContent>
          <CriteriaWeights defaultWeights={defaults.weights} />
          {!state.ok && state.message ? (
            <p className="mt-3 text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
