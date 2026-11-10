'use client';

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';

import { requestPasswordReset } from '@/lib/auth/actions';

import FormErrorAlert from './formErrorAlert';

export default function ForgotPasswordForm({
  defaultEmail,
}: {
  defaultEmail?: string;
}) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <FormErrorAlert error={state?.error} />

      <TextField
        isRequired
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email ?? defaultEmail}
        className="flex flex-col gap-2"
      >
        <Label>{t('email')}</Label>
        <Input className="h-11 text-base" />
        <FieldError />
      </TextField>

      <Button type="submit" size="lg" fullWidth isPending={pending}>
        {t('forgot.submit')}
      </Button>
    </Form>
  );
}
