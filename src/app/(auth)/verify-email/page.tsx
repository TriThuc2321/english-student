import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import {
  AuthCard,
  AuthLink,
  ResendCodeForm,
  VerifyEmailForm,
} from '@/components/auth';
import { resendVerificationCode } from '@/lib/auth/actions';
import { REGISTER_PATH } from '@/lib/auth/constants';

export default async function Page({
  searchParams,
}: PageProps<'/verify-email'>) {
  const t = await getTranslations('auth.verify');
  const { email } = await searchParams;
  if (typeof email !== 'string' || !email) {
    redirect(REGISTER_PATH);
  }

  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle', { email })}
      footer={<AuthLink href={REGISTER_PATH}>{t('changeEmail')}</AuthLink>}
    >
      <VerifyEmailForm email={email} />
      <ResendCodeForm email={email} action={resendVerificationCode} />
    </AuthCard>
  );
}

export const metadata: Metadata = {
  title: 'Verify email',
};
