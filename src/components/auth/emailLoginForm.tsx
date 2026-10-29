'use client';

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import { useTranslations } from 'next-intl';

// Email/password sign-in has no backend yet, so submit and "forgot password" are inert.
export default function EmailLoginForm() {
  const t = useTranslations('auth');

  return (
    <Form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <TextField
        isRequired
        name="email"
        type="email"
        autoComplete="email"
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
          <Link className="text-accent text-sm font-medium">
            {t('forgotPassword')}
          </Link>
        </div>
        <Input className="h-11 text-base" />
        <FieldError />
      </TextField>

      <Button type="submit" size="lg" fullWidth>
        {t('loginButton')}
      </Button>
    </Form>
  );
}
