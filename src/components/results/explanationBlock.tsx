import { useTranslations } from 'next-intl';

import type { AnswerPart, ReviewItem } from '@/lib/results/view';

export const formatPart = ({ key, text }: AnswerPart) =>
  key && text ? `${key} · ${text}` : (key ?? text ?? '');

export const formatParts = (parts: AnswerPart[]) =>
  parts.map(formatPart).join(', ');

export function ExplanationBlock({
  item,
}: {
  item: Pick<ReviewItem, 'explanation' | 'evidence'>;
}) {
  const t = useTranslations('results');
  return (
    <>
      <p className={`text-sm ${item.explanation ? '' : 'text-muted'}`}>
        {item.explanation ?? t('noExplanation')}
      </p>
      {item.evidence && (
        <blockquote className="border-brand-navy mt-3 border-l-2 pl-3 text-sm">
          <p className="text-muted text-xs">
            {t('evidence')}
            {item.evidence.paragraph &&
              ` · ${t('paragraph', { label: item.evidence.paragraph })}`}
          </p>
          {item.evidence.quote && (
            <p className="mt-0.5 italic">“{item.evidence.quote}”</p>
          )}
        </blockquote>
      )}
    </>
  );
}
