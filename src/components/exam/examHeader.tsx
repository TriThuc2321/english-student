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
  sm: 'text-[13px]',
  md: 'text-base',
  lg: 'text-[19px]',
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

  return (
    <header className="border-border bg-surface flex flex-none flex-wrap items-center gap-x-5 gap-y-3 border-b px-5 py-2.5">
      <div className="flex min-w-0 flex-[1_1_260px] items-center gap-2">
        <Link
          href={exitHref}
          aria-label={t('taking.exit')}
          className="text-muted hover:text-foreground hover:bg-default -ml-2 grid size-10 flex-none place-items-center rounded-lg"
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
          className="flex items-center gap-1 text-sm font-medium"
        >
          {sections.map((section) => {
            const current = section.id === sectionId;
            const done = !current && submitted.includes(section.id);
            const Icon = done
              ? LuCheck
              : (SKILL_ICON[section.skill] ?? LuBookOpen);
            return (
              <li
                key={section.id}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded px-2.5 py-1.5',
                  current
                    ? 'bg-brand-navy-soft text-brand-navy font-semibold'
                    : 'text-muted',
                )}
              >
                <Icon aria-hidden className="size-4" />
                {t(`exam.skill.${section.skill}`)}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {remaining !== null && <ExamTimer seconds={remaining} />}
        <output
          className={cn(
            'flex min-w-16 items-center gap-1.5 text-xs',
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
          className="bg-default gap-0.5 rounded-lg p-[3px]"
        >
          {TEXT_SIZES.map((size) => (
            <ToggleButton
              key={size}
              id={size}
              size="sm"
              aria-label={t(`taking.textSize.${size}`)}
              className={cn(
                'data-[selected=true]:bg-segment text-muted data-[selected=true]:text-foreground data-[selected=true]:shadow-surface h-8 w-[34px] min-w-0 rounded-md bg-transparent px-0 font-bold',
                TEXT_SIZE_CLASS[size],
              )}
            >
              A
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {onSubmit && (
          <Button onPress={onSubmit}>{t('taking.submitSection')}</Button>
        )}
      </div>
    </header>
  );
}
