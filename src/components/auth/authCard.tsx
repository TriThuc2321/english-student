import { getTranslations } from 'next-intl/server';

import { LogoIcon } from '@/assets/icons';
import { SwitchLocale, ThemeSwitch } from '@/components/layouts';

type AuthCardProps = {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default async function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: AuthCardProps) {
  const t = await getTranslations('auth');

  return (
    <>
      <div className="absolute top-4 right-4 flex items-center gap-0.5">
        <SwitchLocale />
        <ThemeSwitch />
      </div>

      <div className="flex flex-col items-center gap-2">
        <LogoIcon className="h-8 w-auto" />
        <span className="text-muted text-sm">{t('tagline')}</span>
      </div>

      <main className="bg-surface shadow-overlay flex w-full max-w-[400px] flex-col gap-5 rounded-3xl p-8">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
        </div>

        {children}

        {footer && <p className="text-muted text-center text-sm">{footer}</p>}
      </main>
    </>
  );
}
