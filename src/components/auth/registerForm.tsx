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

import { register } from '@/lib/auth/actions';

import FormErrorAlert from './formErrorAlert';
import PasswordField from './passwordField';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <FormErrorAlert error={state?.error} />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          isRequired
          name="firstName"
          autoComplete="given-name"
          maxLength={255}
          defaultValue={state?.values?.firstName}
          className="flex flex-col gap-2"
        >
          <Label>{t('register.firstName')}</Label>
          <Input className="h-11 text-base" />
          <FieldError />
        </TextField>

        <TextField
          name="lastName"
          autoComplete="family-name"
          maxLength={255}
          defaultValue={state?.values?.lastName}
          className="flex flex-col gap-2"
        >
          <Label>
            {t('register.lastName')}{' '}
            <span className="text-muted font-normal">
              ({t('register.optional')})
            </span>
          </Label>
          <Input className="h-11 text-base" />
          <FieldError />
        </TextField>
      </div>

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

      <PasswordField
        name="password"
        label={t('password')}
        hint={t('passwordHint')}
      />

      <Button type="submit" size="lg" fullWidth isPending={pending}>
        {t('register.submit')}
      </Button>
    </Form>
  );
}
