'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import { loadExamDraft } from '@/lib/exam/draft';

const subscribe = () => () => {};

export default function DraftStatus({ slug }: { slug: string }) {
  const t = useTranslations('taking.intro');
  const hasDraft = useSyncExternalStore(
    subscribe,
    () => loadExamDraft(slug) !== null,
    () => false,
  );
  if (!hasDraft) return null;

  return (
    <span className="text-foreground bg-warning/15 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
      <span aria-hidden className="bg-warning size-1.5 rounded-full" />
      {t('inProgress')}
    </span>
  );
}
