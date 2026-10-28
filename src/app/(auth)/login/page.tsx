import type { Metadata } from 'next';

import {
  Alert,
  buttonVariants,
  Link as HeroLink,
  Separator,
} from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';

import { LogoIcon } from '@/assets/icons';
import { EmailLoginForm } from '@/components/auth';
import { SwitchLocale, ThemeSwitch } from '@/components/layouts';
import { GOOGLE_LOGIN_START_PATH, isLoginError } from '@/lib/auth/constants';

export default async function Page({ searchParams }: PageProps<'/login'>) {
  const t = await getTranslations('auth');
  const { error } = await searchParams;

  return (
    <>
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <SwitchLocale />
        <ThemeSwitch />
      </div>

      <div className="flex items-center gap-2">
        <LogoIcon className="h-8 w-auto" />
        <span className="text-muted text-sm">{t('tagline')}</span>
      </div>

      <main className="bg-surface border-border shadow-surface flex w-full max-w-[420px] flex-col gap-5 rounded-4xl border p-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">
            {t('signInTitle')}
          </h1>
          <p className="text-muted mt-1 text-sm">{t('signInSubtitle')}</p>
        </div>

        {isLoginError(error) && (
          <Alert
            status="danger"
            className="bg-danger-soft border-danger border"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t(`errors.${error}.title`)}</Alert.Title>
              <Alert.Description>
                {t(`errors.${error}.description`)}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <Link
          href={GOOGLE_LOGIN_START_PATH}
          prefetch={false}
          className={buttonVariants({
            variant: 'outline',
            size: 'lg',
            fullWidth: true,
          })}
        >
          <FaGoogle className="size-4" />
          {t('continueWithGoogle')}
        </Link>

        <div className="text-muted flex items-center gap-3 text-xs">
          <Separator className="flex-1" />
          {t('orWithEmail')}
          <Separator className="flex-1" />
        </div>

        <EmailLoginForm />

        {/* Sign-up isn't built yet, so the link has no destination. */}
        <p className="text-muted text-center text-sm">
          {t('newHere')}{' '}
          <HeroLink className="text-accent font-semibold">
            {t('createAccount')}
          </HeroLink>
        </p>
      </main>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Login',
};
