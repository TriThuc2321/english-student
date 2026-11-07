import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { Profile } from '@/types/student-test';

import { LogoIcon } from '@/assets/icons';
import { ROUTES } from '@/constants/routes';

import MobileNav from './mobileNav';
import NavLinks from './navLinks';
import SwitchLocale from './switchLocale';
import ThemeSwitch from './switchTheme';
import UserMenu from './userMenu';

type HeaderProps = {
  profile: Profile | null;
};

export default function Header({ profile }: HeaderProps) {
  const t = useTranslations('common');

  return (
    <header className="border-separator bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href={ROUTES.HOME} aria-label={t('appName')}>
          <LogoIcon className="h-6 w-auto" />
        </Link>
        <div className="hidden md:flex">
          <NavLinks orientation="horizontal" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <ThemeSwitch />
            <SwitchLocale />
          </div>
          <span aria-hidden className="bg-separator h-5 w-px" />
          <UserMenu profile={profile} />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
