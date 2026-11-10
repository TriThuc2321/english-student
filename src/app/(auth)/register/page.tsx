import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import {
  AuthCard,
  AuthLink,
  GoogleButton,
  RegisterForm,
} from '@/components/auth';
import { LOGIN_PATH } from '@/lib/auth/constants';

export default async function Page() {
  const t = await getTranslations('auth');

  return (
    <AuthCard
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <AuthLink href={LOGIN_PATH}>{t('register.signIn')}</AuthLink>
        </>
      }
    >
      <GoogleButton />
      <RegisterForm />
    </AuthCard>
  );
}

export const metadata: Metadata = {
  title: 'Create account',
};
