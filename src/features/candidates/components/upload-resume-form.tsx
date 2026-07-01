'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { RESUME_ACCEPT } from '../constants';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Upload className="size-4" /> {pending ? 'Subiendo…' : 'Subir CV'}
    </Button>
  );
}

export function UploadResumeForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, initialActionState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      ref.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="flex items-center gap-3">
      <input
        name="cv"
        type="file"
        accept={RESUME_ACCEPT}
        required
        className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
      />
      <SubmitButton />
    </form>
  );
}
