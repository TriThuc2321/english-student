import type { Metadata } from 'next';

import { Alert } from '@heroui/react';
import { getTranslations } from 'next-intl/server';

import {
  AuthCard,
  AuthLink,
  EmailLoginForm,
  GoogleButton,
} from '@/components/auth';
import {
  isLoginError,
  isLoginNotice,
  REGISTER_PATH,
} from '@/lib/auth/constants';

export default async function Page({ searchParams }: PageProps<'/login'>) {
  const t = await getTranslations('auth');
  const { error, notice } = await searchParams;

  return (
    <AuthCard
      title={t('signInTitle')}
      subtitle={t('signInSubtitle')}
      footer={
        <>
          {t('newHere')}{' '}
          <AuthLink href={REGISTER_PATH}>{t('createAccount')}</AuthLink>
        </>
      }
    >
      {isLoginError(error) && (
        <Alert status="danger" className="bg-danger-soft border-danger border">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(`errors.${error}.title`)}</Alert.Title>
            <Alert.Description>
              {t(`errors.${error}.description`)}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {isLoginNotice(notice) && (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t(`notices.${notice}.title`)}</Alert.Title>
            <Alert.Description>
              {t(`notices.${notice}.description`)}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <GoogleButton />
      <EmailLoginForm />
    </AuthCard>
  );
}

export const metadata: Metadata = {
  title: 'Login',
};
