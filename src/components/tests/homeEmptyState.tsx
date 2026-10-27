import { getTranslations } from 'next-intl/server';

import type { Paginated, StudentTestListItem } from '@/types/student-test';

type HomeEmptyStateProps = {
  data: Promise<Paginated<StudentTestListItem>>[];
};

export default async function HomeEmptyState({ data }: HomeEmptyStateProps) {
  const results = await Promise.allSettled(data);
  // A failed row shows its own retry UI, so "nothing published" is only claimed when every row loaded.
  const allEmpty = results.every(
    (result) => result.status === 'fulfilled' && result.value.data.length === 0,
  );
  if (!allEmpty) return null;

  const t = await getTranslations('home.empty');

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="text-muted text-sm">{t('description')}</p>
    </div>
  );
}
