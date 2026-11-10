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

import { loginWithEmail } from '@/lib/auth/actions';
import { FORGOT_PASSWORD_PATH } from '@/lib/auth/constants';

import AuthLink from './authLink';
import FormErrorAlert from './formErrorAlert';

export default function EmailLoginForm() {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(
    loginWithEmail,
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
        defaultValue={state?.values?.email}
        className="flex flex-col gap-2"
      >
        <Label>{t('email')}</Label>
        <Input className="h-11 text-base" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        name="password"
        type="password"
        autoComplete="current-password"
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <Label>{t('password')}</Label>
          <AuthLink href={FORGOT_PASSWORD_PATH} className="text-sm font-medium">
            {t('forgotPassword')}
          </AuthLink>
        </div>
        <Input className="h-11 text-base" />
        <FieldError />
      </TextField>

      <Button type="submit" size="lg" fullWidth isPending={pending}>
        {t('loginButton')}
      </Button>
    </Form>
  );
}
