import { buttonVariants, Separator } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaGoogle } from 'react-icons/fa';

import { GOOGLE_LOGIN_START_PATH } from '@/lib/auth/constants';

export default async function GoogleButton() {
  const t = await getTranslations('auth');

  return (
    <>
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
    </>
  );
}
