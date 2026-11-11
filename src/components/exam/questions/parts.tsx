'use client';

import { cn, ToggleButton } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';

import type { PassageView, QuestionView } from '@/lib/exam/group-view';
import type { NumberStatus } from '@/lib/results/view';
import type { Option } from '@/types/student-test';

import { formatParts } from '@/components/results/explanationBlock';
import {
  BADGE_CLASSES,
  FIELD_CLASSES,
  isMiss,
} from '@/components/results/status';

import { useExamGroup } from './context';
import { ReviewNote } from './reviewNote';

export const formatRange = (q: QuestionView) =>
  q.nTo && q.nTo !== q.n ? `${q.n}–${q.nTo}` : `${q.n}`;

export const mmss = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const fillTemplate = (
  text: string,
  blank: (n: number) => ReactNode,
): ReactNode[] =>
  text
    .split(/\{\{\s*(\d+)\s*\}\}/)
    .map((part, i) => (
      <Fragment key={i}>{i % 2 ? blank(Number(part)) : part}</Fragment>
    ));

type QRowProps = {
  n: number;
  label?: string;
  // For a task that fills the card: no number badge or focus tint competing with the editor.
  bare?: boolean;
  children: ReactNode;
};

export const FlagToggle = ({ n }: { n: number }) => {
  const t = useTranslations('taking');
  const { flagged, toggleFlag, review } = useExamGroup();
  const isFlagged = flagged.includes(n);
  if (review) return null;
  return (
    <ToggleButton
      isIconOnly
      variant="ghost"
      aria-label={t('flagN', { n })}
      isSelected={isFlagged}
      onChange={() => toggleFlag(n)}
      className={cn(
        'text-muted hover:text-foreground size-8 min-w-8 shrink-0 rounded-full align-middle',
        isFlagged && 'text-warning hover:text-warning',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill={isFlagged ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M5 21V4m0 0h12l-2 4 2 4H5" />
      </svg>
    </ToggleButton>
  );
};

export const QRow = ({ n, label, bare = false, children }: QRowProps) => {
  const { anchorId, review } = useExamGroup();
  return (
    <div
      id={anchorId(n)}
      // Review rows take focus so the navigator can bring them into view; their inputs are disabled.
      tabIndex={review ? -1 : undefined}
      className={cn(
        'group/q mb-1 grid scroll-mt-24 gap-3 rounded-xl p-2.5 transition-colors outline-none',
        bare
          ? 'grid-cols-[1fr_auto]'
          : 'focus-within:bg-surface-secondary grid-cols-[auto_1fr_auto]',
      )}
    >
      {!bare && <QNum status={review?.item(n)?.status}>{label ?? n}</QNum>}
      <div className="min-w-0">
        {children}
        {review && <ReviewNote n={n} />}
      </div>
      <FlagToggle n={n} />
    </div>
  );
};

const QNUM_CLASS =
  'bg-brand-navy-soft text-brand-navy inline-grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1.5 align-middle text-[13px] leading-none font-semibold tabular-nums';

export const QNum = ({
  children,
  status,
}: {
  children: ReactNode;
  status?: NumberStatus;
}) => (
  <span className={cn(QNUM_CLASS, status && BADGE_CLASSES[status])}>
    {children}
  </span>
);

// Inline blanks flag from their number so a flag icon doesn't break the sentence after every gap.
const FlagNum = ({ n }: { n: number }) => {
  const t = useTranslations('taking');
  const { flagged, toggleFlag, review } = useExamGroup();
  const isFlagged = flagged.includes(n);
  if (review) return <QNum status={review.item(n)?.status}>{n}</QNum>;
  return (
    <ToggleButton
      aria-label={t('flagN', { n })}
      isSelected={isFlagged}
      onChange={() => toggleFlag(n)}
      className={cn(
        QNUM_CLASS,
        'hover:ring-brand-navy/25 relative h-7 min-h-0 min-w-7 gap-0 border-0 transition-colors hover:ring-2',
        isFlagged &&
          'bg-warning/25 text-foreground data-[selected=true]:bg-warning/25',
      )}
    >
      {n}
      {isFlagged && (
        <span
          aria-hidden
          className="bg-warning ring-surface absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2"
        />
      )}
    </ToggleButton>
  );
};

export const Prompt = ({ children }: { children: ReactNode }) => (
  <p className="text-foreground mt-0.5 mb-2.5 leading-relaxed font-medium">
    {children}
  </p>
);

export const Hint = ({ children }: { children: ReactNode }) => (
  <p className="text-muted -mt-1 mb-2 text-sm">{children}</p>
);

const fieldClass =
  'border-field-border bg-field-background rounded-field min-h-9 border px-3 py-1 text-base leading-tight outline-none transition-[border-color,box-shadow] hover:border-brand-navy/50 focus:border-brand-navy focus:ring-3 focus:ring-brand-navy/15 disabled:opacity-60';

const keyOptions = (options: Option[], disabledKeys?: string[]) =>
  options.map((o) => (
    <option key={o.key} value={o.key} disabled={disabledKeys?.includes(o.key)}>
      {o.key}
    </option>
  ));

type BlankProps = {
  n: number;
  options?: Option[];
  /** Off when the surrounding row already renders this question's flag toggle. */
  withFlag?: boolean;
};

const CorrectChip = ({ text }: { text: string }) => (
  <span className="bg-success/15 text-success rounded-md px-2 py-0.5 text-sm font-semibold">
    {text}
  </span>
);

export const Blank = ({ n, options, withFlag = true }: BlankProps) => {
  const t = useTranslations('taking');
  const { answers, setAnswer, readOnly, anchorId, review } = useExamGroup();
  const value = (answers[n] as string | undefined) ?? '';
  const label = t('answerLabel', { n });
  const item = review?.item(n);
  const tint = item && FIELD_CLASSES[item.status];
  // In review the controls are disabled and can't take focus, so the wrapper
  // carries the anchor instead, like QRow does.
  const fieldId = review ? undefined : anchorId(n);

  return (
    <span
      id={review ? anchorId(n) : undefined}
      tabIndex={review ? -1 : undefined}
      className="mx-0.5 my-0.5 inline-flex scroll-mt-24 items-center gap-1.5 rounded-md align-middle outline-none"
    >
      {withFlag ? <FlagNum n={n} /> : <QNum>{n}</QNum>}
      {options ? (
        <select
          id={fieldId}
          aria-label={label}
          className={cn(fieldClass, tint)}
          value={value}
          disabled={readOnly}
          onChange={(e) => setAnswer(n, e.target.value)}
        >
          <option value="">—</option>
          {keyOptions(options)}
        </select>
      ) : (
        <input
          id={fieldId}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          size={Math.max(12, value.length + 2)}
          className={cn(fieldClass, 'max-w-full min-w-32', tint)}
          value={value}
          disabled={readOnly}
          onChange={(e) => setAnswer(n, e.target.value)}
        />
      )}
      {item?.correctAnswer && isMiss(item.status) && (
        <CorrectChip text={formatParts(item.correctAnswer)} />
      )}
    </span>
  );
};

export const KeySelect = ({
  n,
  options,
  disabledKeys,
}: {
  n: number;
  options: Option[];
  disabledKeys?: string[];
}) => {
  const t = useTranslations('taking');
  const { answers, setAnswer, readOnly, review } = useExamGroup();
  const item = review?.item(n);
  return (
    <select
      aria-label={t('answerLabel', { n })}
      className={cn(fieldClass, item && FIELD_CLASSES[item.status])}
      value={(answers[n] as string | undefined) ?? ''}
      disabled={readOnly}
      onChange={(e) => setAnswer(n, e.target.value)}
    >
      <option value="">—</option>
      {keyOptions(options, disabledKeys)}
    </select>
  );
};

export const TextAnswer = ({ n }: { n: number }) => {
  const t = useTranslations('taking');
  const { answers, setAnswer, readOnly, review } = useExamGroup();
  const item = review?.item(n);
  return (
    <input
      aria-label={t('answerLabel', { n })}
      autoComplete="off"
      className={cn(
        'border-field-border focus:border-brand-navy min-h-10 w-full max-w-72 border-b-[1.5px] bg-transparent px-1 py-1 text-base transition-colors outline-none disabled:opacity-60',
        item && FIELD_CLASSES[item.status],
      )}
      value={(answers[n] as string | undefined) ?? ''}
      disabled={readOnly}
      onChange={(e) => setAnswer(n, e.target.value)}
    />
  );
};

type ChoicesProps = {
  n: number;
  options: Option[];
  multi?: boolean;
  limit?: number;
  variant?: 'list' | 'pills' | 'bubbles';
};

export const Choices = ({
  n,
  options,
  multi,
  limit,
  variant = 'list',
}: ChoicesProps) => {
  const t = useTranslations('review');
  const { group, answers, setAnswer, readOnly, review } = useExamGroup();
  const value = answers[n];
  const picked = Array.isArray(value) ? value : [];
  const reviewed = review?.question(n)[0];
  const correctKeys = reviewed?.correctAnswer?.flatMap((p) => p.key ?? []);
  const verdict = (key: string, isChecked: boolean) =>
    !correctKeys
      ? null
      : correctKeys.includes(key)
        ? 'right'
        : isChecked
          ? 'wrong'
          : null;

  const toggle = (key: string) => {
    if (!multi) return setAnswer(n, key);
    setAnswer(
      n,
      picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key],
    );
  };

  return (
    <div
      className={cn(
        variant === 'list' ? 'flex flex-col gap-1' : 'flex flex-wrap gap-2',
      )}
    >
      {options.map((o) => {
        const isChecked = multi ? picked.includes(o.key) : value === o.key;
        const isDisabled =
          readOnly ||
          (multi && !isChecked && limit != null && picked.length >= limit);
        const mark = verdict(o.key, isChecked);
        return (
          <label
            key={o.key}
            className={cn(
              'rounded-field relative flex cursor-pointer items-center gap-2',
              'has-[:focus-visible]:ring-brand-navy/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
              variant === 'list' &&
                'hover:bg-default min-h-10 rounded-xl px-2.5 py-1.5 transition-colors',
              variant === 'list' &&
                isChecked &&
                'bg-brand-navy-soft/60 hover:bg-brand-navy-soft/60',
              variant === 'pills' &&
                'border-border bg-surface hover:border-field-border min-h-9 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              variant === 'bubbles' &&
                'border-border bg-surface hover:border-field-border grid size-10 place-items-center rounded-full border font-semibold transition-colors',
              variant !== 'list' &&
                isChecked &&
                'border-brand-navy bg-brand-navy text-brand-navy-foreground hover:border-brand-navy',
              isDisabled && !review && 'cursor-not-allowed opacity-50',
              review && 'cursor-default',
              review && !mark && 'opacity-60',
              mark === 'right' &&
                'bg-success/15 text-foreground hover:bg-success/15 ring-success/50 ring-1',
              mark === 'wrong' &&
                'bg-danger-soft text-foreground hover:bg-danger-soft ring-danger/60 ring-1',
              // Pills and bubbles have no room for a label, so the student's pick gets a stronger ring.
              review &&
                isChecked &&
                variant !== 'list' &&
                'ring-offset-surface ring-2 ring-offset-2',
            )}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={`${group.id}-${n}`}
              value={o.key}
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => toggle(o.key)}
              className="sr-only"
            />
            {variant === 'list' ? (
              <>
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                    isChecked
                      ? 'border-brand-navy bg-brand-navy text-brand-navy-foreground'
                      : 'border-border bg-surface',
                    mark === 'right' &&
                      'border-success bg-success text-success-foreground',
                    mark === 'wrong' &&
                      'border-danger bg-danger text-danger-foreground',
                  )}
                >
                  {o.key}
                </span>
                {o.text && <span>{o.text}</span>}
                {review && isChecked && (
                  <span className="text-muted ml-auto text-xs font-medium">
                    {t('yourChoice')}
                  </span>
                )}
              </>
            ) : (
              <span>{o.text && variant === 'pills' ? o.text : o.key}</span>
            )}
          </label>
        );
      })}
    </div>
  );
};

export const OptionsBox = ({
  title,
  options,
}: {
  title?: string;
  options: Option[];
}) => (
  <div className="bg-surface-secondary mb-3 rounded-xl p-4">
    {title && <h5 className="mb-2 text-sm font-semibold">{title}</h5>}
    <ol className="flex flex-col gap-0.5 text-sm">
      {options.map((o) => (
        <li key={o.key}>
          <b className="text-brand-navy mr-2 inline-block min-w-6">{o.key}</b>
          {o.text}
        </li>
      ))}
    </ol>
  </div>
);

export const PassagePane = ({
  passage,
  className,
}: {
  passage: PassageView;
  className?: string;
}) => (
  <div
    className={cn(
      'border-border max-h-[460px] overflow-y-auto border-b p-4 text-base leading-7 md:border-r md:border-b-0',
      className,
    )}
  >
    <div className="mx-auto max-w-[72ch]">
      <h4 className="mb-3 text-xl font-semibold tracking-tight">
        {passage.title}
      </h4>
      {passage.subtitle && (
        <p className="text-muted mb-3">{passage.subtitle}</p>
      )}
      {passage.paragraphs.map((p, i) => (
        <p key={i} className="mb-4 text-pretty">
          {p.label && (
            <span className="bg-brand-navy-soft text-brand-navy mr-1.5 inline-grid size-5 place-items-center rounded text-xs font-semibold">
              {p.label}
            </span>
          )}
          {p.text}
        </p>
      ))}
    </div>
  </div>
);
