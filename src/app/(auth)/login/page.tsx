import type { Metadata } from 'next';

import { Alert, buttonVariants } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';

import { LogoIcon } from '@/assets/icons';
import { SwitchLocale, ThemeSwitch } from '@/components/layouts';
import ENV from '@/configs/env';
import { AUTH_CLIENT, isLoginError } from '@/lib/auth/constants';

export default async function Page({ searchParams }: PageProps<'/login'>) {
  const t = await getTranslations('auth');
  const { error } = await searchParams;

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <SwitchLocale />
        <ThemeSwitch />
      </div>

      <div className="mb-8">
        <LogoIcon className="h-8" />
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          {t('welcomeBack')}
        </h1>
        <p className="text-default-700 max-w-md text-lg">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {isLoginError(error) && (
        <Alert status="danger" className="mb-6 w-full">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t(`errors.${error}`)}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Link
        href={`${ENV.API_URL}/api/auth/google?client=${AUTH_CLIENT}`}
        className={buttonVariants({ size: 'lg', fullWidth: true })}
      >
        <FaGoogle className="h-5 w-5 text-white" />
        {t('continueWithGoogle')}
      </Link>

      <p className="text-default-600 mt-4 text-center text-sm">
        {t('loginFooter')}
      </p>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Login',
};
