import { Button } from '@heroui/react';
import { getTranslations } from 'next-intl/server';

import { logout } from '@/lib/auth/actions';

type MainLayoutProps = {
  children: React.ReactNode;
};

export default async function MainLayout({ children }: MainLayoutProps) {
  const t = await getTranslations('auth');

  return (
    <div className="bg-background flex h-screen w-screen items-center justify-center">
      <p>Main layout</p>
      <form action={logout}>
        <Button type="submit" variant="secondary">
          {t('logout')}
        </Button>
      </form>
      {children}
    </div>
  );
}
