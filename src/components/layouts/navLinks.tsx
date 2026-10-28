'use client';

import { cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

type NavLinksProps = {
  orientation: 'horizontal' | 'vertical';
  onNavigate?: () => void;
};

// The library lives at `/`, but test pages under /tests belong to it too.
const LINKS = [
  { href: ROUTES.HOME, label: 'tests', match: [ROUTES.TESTS] },
] as const;

const isActive = (pathname: string, href: string, match: readonly string[]) =>
  pathname === href ||
  match.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export default function NavLinks({ orientation, onNavigate }: NavLinksProps) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();

  return (
    <nav
      className={cn('flex gap-1', {
        'flex-col': orientation === 'vertical',
        'items-center': orientation === 'horizontal',
      })}
    >
      {LINKS.map(({ href, label, match }) => {
        const active = isActive(pathname, href, match);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-muted hover:text-foreground hover:bg-surface-secondary rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              {
                'text-accent-soft-foreground bg-accent-soft hover:text-accent-soft-foreground hover:bg-accent-soft':
                  active,
              },
            )}
          >
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
