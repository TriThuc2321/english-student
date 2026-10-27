'use client';

import { Button, buttonVariants } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

import { ROUTES } from '@/constants/routes';
import { clearExamDraft, hasExamDraft } from '@/lib/exam/draft';

type StartExamButtonProps = {
  slug: string;
};

const subscribe = () => () => {};

export default function StartExamButton({ slug }: StartExamButtonProps) {
  const t = useTranslations('taking.intro');
  const router = useRouter();
  // The server snapshot keeps the first client render identical to SSR (no draft).
  const hasDraft = useSyncExternalStore(
    subscribe,
    () => hasExamDraft(slug),
    () => false,
  );
  const href = ROUTES.takeTest(slug);

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={href} className={buttonVariants({ variant: 'primary' })}>
        {hasDraft ? t('continue') : t('start')}
      </Link>
      {hasDraft && (
        <Button
          variant="secondary"
          onPress={() => {
            clearExamDraft(slug);
            router.push(href);
          }}
        >
          {t('restart')}
        </Button>
      )}
    </div>
  );
}
