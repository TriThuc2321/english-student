'use client';

import { cn, Tabs } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestPart } from '@/types/student-test';

import { toPassageView } from '@/lib/exam/group-view';

import { GroupView } from './questions/groupView';
import { PassagePane } from './questions/parts';

type PartViewProps = {
  part: StudentTestPart | null;
  index: number;
  answers: Record<number, Answer>;
  onAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  onToggleFlag: (n: number) => void;
};

export function PartView({
  part,
  index,
  answers,
  onAnswer,
  readOnly,
  flagged,
  onToggleFlag,
}: PartViewProps) {
  const t = useTranslations('taking');
  const [tab, setTab] = useState<'passage' | 'questions'>('questions');

  const groups = part
    ? [...part.questionGroups].sort((a, b) => a.order - b.order)
    : [];

  if (!part || groups.length === 0) {
    return (
      <p className="text-muted py-16 text-center text-sm">{t('emptyPart')}</p>
    );
  }

  const sharedPassage =
    part.passage && groups.some((g) => g.passages.length === 0)
      ? toPassageView(part.passage)
      : null;

  const questions = (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      {groups.map((group) => (
        <GroupView
          key={group.id}
          group={group}
          answers={answers}
          setAnswer={onAnswer}
          readOnly={readOnly}
          flagged={flagged}
          toggleFlag={onToggleFlag}
        />
      ))}
    </div>
  );

  if (!sharedPassage) {
    return (
      <section
        aria-label={part.title ?? t('partFallback', { n: index + 1 })}
        className="min-h-0 overflow-y-auto"
      >
        {questions}
      </section>
    );
  }

  return (
    <section
      aria-label={part.title ?? t('partFallback', { n: index + 1 })}
      className="flex min-h-0 flex-col lg:grid lg:grid-cols-2"
    >
      <Tabs
        className="lg:hidden"
        selectedKey={tab}
        onSelectionChange={(key) => setTab(key as typeof tab)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('passage')}>
            <Tabs.Tab id="passage">
              {t('passage')}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="questions">
              {t('questions')}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div
        className={cn(
          'min-h-0 overflow-y-auto lg:block',
          tab === 'passage' ? 'block' : 'hidden',
        )}
      >
        <PassagePane
          passage={sharedPassage}
          className="max-h-none border-0 p-4 md:border-r-0"
        />
      </div>
      <div
        className={cn(
          'min-h-0 overflow-y-auto lg:block',
          tab === 'questions' ? 'block' : 'hidden',
        )}
      >
        {questions}
      </div>
    </section>
  );
}
