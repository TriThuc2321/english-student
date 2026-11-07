'use client';

import type { IconType } from 'react-icons';

import { Button, cn, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LuBookOpen,
  LuCheck,
  LuChevronLeft,
  LuHeadphones,
  LuLoaderCircle,
  LuMic,
  LuPenLine,
  LuTriangleAlert,
} from 'react-icons/lu';

import type { StudentTestDetail } from '@/types/student-test';

import { sectionDurationSeconds } from '@/lib/exam/structure';

import type { SaveStatus } from './useExamPersistence';

import { ExamTimer } from './examTimer';
import { TEXT_SIZES, type TextSize } from './useExamTextSize';

const SKILL_ICON: Record<string, IconType> = {
  LISTENING: LuHeadphones,
  READING: LuBookOpen,
  WRITING: LuPenLine,
  SPEAKING: LuMic,
};

const TEXT_SIZE_CLASS: Record<TextSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

type ExamHeaderProps = {
  test: StudentTestDetail;
  practice: boolean;
  sectionId: number;
  submitted: number[];
  remaining: number | null;
  saveStatus: SaveStatus;
  textSize: TextSize;
  onTextSize: (size: TextSize) => void;
  onSubmit: (() => void) | null;
  exitHref: string;
};

export function ExamHeader({
  test,
  practice,
  sectionId,
  submitted,
  remaining,
  saveStatus,
  textSize,
  onTextSize,
  onSubmit,
  exitHref,
}: ExamHeaderProps) {
  const t = useTranslations();
  const sections = [...test.testSections].sort((a, b) => a.order - b.order);
  const current = sections.find((s) => s.id === sectionId);
  const sectionTotal = current ? sectionDurationSeconds(test, current) : null;

  return (
    <header className="border-separator bg-surface flex flex-none flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-2 md:px-5">
      <div className="flex min-w-0 flex-[1_1_260px] items-center gap-2">
        <Link
          href={exitHref}
          aria-label={t('taking.exit')}
          className="text-muted hover:text-foreground hover:bg-default -ml-1.5 grid size-9 flex-none place-items-center rounded-full transition-colors"
        >
          <LuChevronLeft aria-hidden className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-semibold">{test.title}</h1>
          <span className="text-muted text-xs">
            {t(`exam.${test.examType}`)} ·{' '}
            {practice ? t('taking.practice') : t('taking.fullTest')}
          </span>
        </div>
      </div>
      {sections.length > 1 && (
        <ol
          aria-label={t('taking.intro.sections')}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {sections.map((section, index) => {
            const current = section.id === sectionId;
            const done = !current && submitted.includes(section.id);
            const Icon = SKILL_ICON[section.skill] ?? LuBookOpen;
            return (
              <li
                key={section.id}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2',
                  current ? 'text-foreground' : 'text-muted',
                )}
              >
                {index > 0 && (
                  <span aria-hidden className="bg-border h-px w-4" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    'grid size-6 place-items-center rounded-full text-xs',
                    current && 'bg-brand-navy text-brand-navy-foreground',
                    done && 'bg-success/15 text-success',
                    !current && !done && 'bg-default',
                  )}
                >
                  {done ? (
                    <LuCheck className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </span>
                <span
                  className={cn('hidden sm:inline', current && 'font-semibold')}
                >
                  {t(`exam.skill.${section.skill}`)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {remaining !== null && (
          <ExamTimer seconds={remaining} total={sectionTotal} />
        )}
        <output
          className={cn(
            'hidden min-w-16 items-center gap-1.5 text-xs sm:flex',
            saveStatus === 'failed' ? 'text-danger' : 'text-muted',
          )}
        >
          {saveStatus === 'saving' && (
            <LuLoaderCircle aria-hidden className="size-4 animate-spin" />
          )}
          {saveStatus === 'saved' && <LuCheck aria-hidden className="size-4" />}
          {saveStatus === 'failed' && (
            <LuTriangleAlert aria-hidden className="size-4" />
          )}
          {t(`taking.saveStatus.${saveStatus}`)}
        </output>
        <ToggleButtonGroup
          aria-label={t('taking.textSize.label')}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[textSize]}
          onSelectionChange={(keys) => {
            const [next] = keys;
            if (next) onTextSize(next as TextSize);
          }}
          className="bg-default gap-0.5 rounded-full p-[3px]"
        >
          {TEXT_SIZES.map((size) => (
            <ToggleButton
              key={size}
              id={size}
              size="sm"
              aria-label={t(`taking.textSize.${size}`)}
              className={cn(
                'data-[selected=true]:bg-segment text-muted data-[selected=true]:text-foreground data-[selected=true]:shadow-surface h-7 w-8 min-w-0 rounded-full bg-transparent px-0 font-semibold',
                TEXT_SIZE_CLASS[size],
              )}
            >
              A
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {onSubmit && (
          <Button
            onPress={onSubmit}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
          >
            {t('taking.submitSection')}
          </Button>
        )}
      </div>
    </header>
  );
}
