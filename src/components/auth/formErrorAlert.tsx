'use client';

import { Alert } from '@heroui/react';
import { useTranslations } from 'next-intl';

import type { AuthFormError } from '@/lib/auth/form-state';

export default function FormErrorAlert({ error }: { error?: AuthFormError }) {
  const t = useTranslations('auth.formErrors');

  if (!error) return null;
  return (
    <Alert status="danger" className="bg-danger-soft border-danger border">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{t(error)}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
