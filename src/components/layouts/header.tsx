import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { Profile } from '@/types/student-test';

import { LogoHorizontalIcon } from '@/assets/icons';
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
    <header className="border-separator bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href={ROUTES.HOME} aria-label={t('appName')}>
          <LogoHorizontalIcon className="h-7 w-auto" />
        </Link>
        <div className="hidden md:flex">
          <NavLinks orientation="horizontal" />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <SwitchLocale />
          <UserMenu profile={profile} />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
