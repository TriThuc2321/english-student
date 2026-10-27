'use client';

import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentQuestionGroup } from '@/types/student-test';

import { toGroupView } from '@/lib/exam/group-view';

import { ExamGroupContext } from './context';
import { PassagePane } from './parts';
import { VIEWS } from './views';

const KEYWORDS =
  /\b(ONE|TWO|THREE|NO MORE THAN|AND\/OR A NUMBER|ONLY|TRUE|FALSE|NOT GIVEN|YES|NO)\b/;

const Instruction = ({ text }: { text: string }) => (
  <span className="text-foreground/80 basis-full text-sm leading-relaxed whitespace-pre-line">
    {text.split(KEYWORDS).map((part, i) =>
      i % 2 ? (
        <b key={i} className="text-accent font-semibold">
          {part}
        </b>
      ) : (
        part
      ),
    )}
  </span>
);

type GroupViewProps = {
  group: StudentQuestionGroup;
  answers: Record<number, Answer>;
  setAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  toggleFlag: (n: number) => void;
};

export function GroupView({
  group,
  answers,
  setAnswer,
  readOnly,
  flagged,
  toggleFlag,
}: GroupViewProps) {
  const t = useTranslations('taking');
  const view = useMemo(() => toGroupView(group), [group]);
  const View = VIEWS[view.view];

  const from = view.questions[0]?.n;
  const lastQuestion = view.questions.at(-1);
  const to = lastQuestion && Math.max(lastQuestion.n, lastQuestion.nTo);
  const range =
    from == null || to == null
      ? undefined
      : from === to
        ? `${from}`
        : `${from}–${to}`;

  return (
    <ExamGroupContext.Provider
      value={{ group: view, answers, setAnswer, readOnly, flagged, toggleFlag }}
    >
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {range && (
            <Chip color="accent" size="sm" variant="soft">
              <Chip.Label className="font-semibold">
                {t('questionsRange', { range })}
              </Chip.Label>
            </Chip>
          )}
          {view.instruction && <Instruction text={view.instruction} />}
        </div>
        {view.passages.map((passage, i) => (
          <PassagePane
            key={i}
            passage={passage}
            className="bg-default/40 rounded-field max-h-none border-0 md:border-r-0"
          />
        ))}
        <div className="min-w-0">
          <View />
        </div>
      </section>
    </ExamGroupContext.Provider>
  );
}
