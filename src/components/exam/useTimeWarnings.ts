import { toast } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { DANGER_SECONDS, WARNING_SECONDS } from './examTimer';

const THRESHOLDS = [WARNING_SECONDS, DANGER_SECONDS];

export function useTimeWarnings(sectionId: number, remaining: number | null) {
  const t = useTranslations('taking.timeWarning');
  const prev = useRef<{ sectionId: number; remaining: number | null }>(null);

  useEffect(() => {
    const last = prev.current;
    prev.current = { sectionId, remaining };
    // Only a countdown crossing a threshold warns; restoring a draft below it stays quiet.
    if (
      !last ||
      last.sectionId !== sectionId ||
      last.remaining === null ||
      remaining === null
    ) {
      return;
    }
    const crossed = THRESHOLDS.find(
      (s) => last.remaining! >= s && remaining < s,
    );
    if (crossed === undefined) return;
    const id = toast.warning(t('title', { minutes: crossed / 60 }), {
      description: t('body'),
      actionProps: {
        children: t('dismiss'),
        variant: 'tertiary',
        onPress: () => toast.close(id),
      },
    });
  }, [sectionId, remaining, t]);
}
