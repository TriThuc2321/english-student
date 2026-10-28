'use client';

import { cn, ToggleButton } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';

import type { PassageView, QuestionView } from '@/lib/exam/group-view';
import type { Option } from '@/types/student-test';

import { useExamGroup } from './context';

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

type QRowProps = { n: number; label?: string; children: ReactNode };

export const FlagToggle = ({ n }: { n: number }) => {
  const t = useTranslations('taking');
  const { flagged, toggleFlag } = useExamGroup();
  const isFlagged = flagged.includes(n);
  return (
    <ToggleButton
      isIconOnly
      variant="ghost"
      aria-label={t('flagN', { n })}
      isSelected={isFlagged}
      onChange={() => toggleFlag(n)}
      className={cn('shrink-0 align-middle', isFlagged && 'text-warning')}
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

export const QRow = ({ n, label, children }: QRowProps) => (
  <div
    id={`q-${n}`}
    className="rounded-field mb-1.5 grid grid-cols-[auto_1fr_auto] gap-2.5 border border-transparent p-2"
  >
    <QNum>{label ?? n}</QNum>
    <div className="min-w-0">{children}</div>
    <FlagToggle n={n} />
  </div>
);

export const QNum = ({ children }: { children: ReactNode }) => (
  <span className="bg-accent-soft text-accent-soft-foreground rounded-field inline-grid h-7 min-w-7 shrink-0 place-items-center px-1.5 align-middle text-[13px] leading-none font-bold">
    {children}
  </span>
);

export const Prompt = ({ children }: { children: ReactNode }) => (
  <p className="text-foreground mt-0.5 mb-2 font-medium">{children}</p>
);

export const Hint = ({ children }: { children: ReactNode }) => (
  <p className="text-muted -mt-1 mb-2 text-sm">{children}</p>
);

const fieldClass =
  'border-border bg-surface rounded-field min-h-10 border px-3 py-1 text-base leading-tight outline-none focus:border-accent disabled:opacity-60';

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

export const Blank = ({ n, options, withFlag = true }: BlankProps) => {
  const t = useTranslations('taking');
  const { answers, setAnswer, readOnly } = useExamGroup();
  const value = (answers[n] as string | undefined) ?? '';
  const label = t('answerLabel', { n });

  return (
    <span className="mx-0.5 inline-flex items-center gap-1.5 align-middle">
      <QNum>{n}</QNum>
      {options ? (
        <select
          id={`q-${n}`}
          aria-label={label}
          className={fieldClass}
          value={value}
          disabled={readOnly}
          onChange={(e) => setAnswer(n, e.target.value)}
        >
          <option value="">—</option>
          {keyOptions(options)}
        </select>
      ) : (
        <input
          id={`q-${n}`}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          className={cn(fieldClass, 'w-32')}
          value={value}
          disabled={readOnly}
          onChange={(e) => setAnswer(n, e.target.value)}
        />
      )}
      {withFlag && <FlagToggle n={n} />}
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
  const { answers, setAnswer, readOnly } = useExamGroup();
  return (
    <select
      aria-label={t('answerLabel', { n })}
      className={fieldClass}
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
  const { answers, setAnswer, readOnly } = useExamGroup();
  return (
    <input
      aria-label={t('answerLabel', { n })}
      autoComplete="off"
      className="border-muted focus:border-accent min-h-10 w-full max-w-72 border-b-[1.5px] bg-transparent px-1 py-1 text-base outline-none disabled:opacity-60"
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
  const { group, answers, setAnswer, readOnly } = useExamGroup();
  const value = answers[n];
  const picked = Array.isArray(value) ? value : [];

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
        return (
          <label
            key={o.key}
            className={cn(
              'rounded-field relative flex cursor-pointer items-center gap-2',
              variant !== 'list' &&
                'has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
              variant === 'list' && 'hover:bg-default min-h-10 px-2 py-1.5',
              variant === 'pills' &&
                'border-border min-h-10 border px-4 py-1.5 text-sm font-semibold',
              variant === 'bubbles' &&
                'border-border grid size-10 place-items-center rounded-full border font-bold',
              variant !== 'list' &&
                isChecked &&
                'border-accent bg-accent-soft text-accent-soft-foreground',
              isDisabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={`${group.id}-${n}`}
              value={o.key}
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => toggle(o.key)}
              className={cn('accent-accent', variant !== 'list' && 'sr-only')}
            />
            {variant === 'list' ? (
              <>
                <span className="border-border grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
                  {o.key}
                </span>
                {o.text && <span>{o.text}</span>}
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
  <div className="border-border bg-default/40 rounded-field mb-3 border p-3">
    {title && <h5 className="mb-1.5 text-sm font-bold">{title}</h5>}
    <ol className="flex flex-col gap-0.5 text-sm">
      {options.map((o) => (
        <li key={o.key}>
          <b className="text-accent mr-2 inline-block min-w-6">{o.key}</b>
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
      'border-border max-h-[460px] overflow-y-auto border-b p-4 text-base leading-[1.65] md:border-r md:border-b-0',
      className,
    )}
  >
    <div className="max-w-[70ch]">
      <h4 className="mb-2 text-lg font-bold">{passage.title}</h4>
      {passage.subtitle && (
        <p className="text-muted mb-3">{passage.subtitle}</p>
      )}
      {passage.paragraphs.map((p, i) => (
        <p key={i} className="mb-4">
          {p.label && (
            <span className="bg-accent-soft text-accent-soft-foreground mr-1.5 inline-grid size-5 place-items-center rounded text-xs font-bold">
              {p.label}
            </span>
          )}
          {p.text}
        </p>
      ))}
    </div>
  </div>
);
