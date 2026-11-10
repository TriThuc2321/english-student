'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useActionState, useEffect, useState } from 'react';

import type { AuthFormState } from '@/lib/auth/form-state';

import { RESEND_COOLDOWN_SECONDS } from '@/lib/auth/constants';

import FormErrorAlert from './formErrorAlert';

type ResendCodeFormProps = {
  email: string;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export default function ResendCodeForm({ email, action }: ResendCodeFormProps) {
  const t = useTranslations('auth.resend');
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <input type="hidden" name="email" value={email} />
      <FormErrorAlert error={state?.error} />
      {state?.sentAt && (
        <output className="text-success text-sm">{t('sent')}</output>
      )}
      {/* Remounting on each successful send restarts the cooldown. */}
      <ResendButton key={state?.sentAt ?? 0} pending={pending} />
    </form>
  );
}

function ResendButton({ pending }: { pending: boolean }) {
  const t = useTranslations('auth.resend');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) clearInterval(id);
        return Math.max(s - 1, 0);
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-muted flex items-center gap-1 text-sm">
      {t('prompt')}
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        isPending={pending}
        isDisabled={secondsLeft > 0}
      >
        {secondsLeft > 0 ? t('wait', { seconds: secondsLeft }) : t('action')}
      </Button>
    </p>
  );
}
