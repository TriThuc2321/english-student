'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ error, retry }: ErrorProps) {
  const t = useTranslations('common.error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-foreground text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted">{t('description')}</p>
      <Button onPress={() => retry()}>{t('retry')}</Button>
    </div>
  );
}
