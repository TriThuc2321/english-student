import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import {
  AuthCard,
  AuthLink,
  ResendCodeForm,
  ResetPasswordForm,
} from '@/components/auth';
import { resendPasswordResetCode } from '@/lib/auth/actions';
import {
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
  withEmail,
} from '@/lib/auth/constants';

export default async function Page({
  searchParams,
}: PageProps<'/reset-password'>) {
  const t = await getTranslations('auth');
  const { email } = await searchParams;
  if (typeof email !== 'string' || !email) {
    redirect(FORGOT_PASSWORD_PATH);
  }

  return (
    <AuthCard
      title={t('reset.title')}
      subtitle={t('reset.subtitle', { email })}
      footer={
        <>
          <AuthLink href={withEmail(FORGOT_PASSWORD_PATH, email)}>
            {t('verify.changeEmail')}
          </AuthLink>
          {' · '}
          <AuthLink href={LOGIN_PATH}>{t('forgot.backToLogin')}</AuthLink>
        </>
      }
    >
      <ResetPasswordForm email={email} />
      <ResendCodeForm email={email} action={resendPasswordResetCode} />
    </AuthCard>
  );
}

export const metadata: Metadata = {
  title: 'Reset password',
};
