import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { AuthCard, AuthLink, ForgotPasswordForm } from '@/components/auth';
import { LOGIN_PATH } from '@/lib/auth/constants';

export default async function Page({
  searchParams,
}: PageProps<'/forgot-password'>) {
  const t = await getTranslations('auth.forgot');
  const { email } = await searchParams;

  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      footer={<AuthLink href={LOGIN_PATH}>{t('backToLogin')}</AuthLink>}
    >
      <ForgotPasswordForm
        defaultEmail={typeof email === 'string' ? email : undefined}
      />
    </AuthCard>
  );
}

export const metadata: Metadata = {
  title: 'Forgot password',
};
