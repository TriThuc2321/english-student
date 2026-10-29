import { useTranslations } from 'next-intl';

export function useFormatDuration() {
  const t = useTranslations('tests');
  return (total: number) => {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (hours === 0) return t('minutes', { count: minutes });
    if (minutes === 0) return t('hours', { count: hours });
    return t('hoursMinutes', { hours, minutes });
  };
}
