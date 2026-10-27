'use client';

import { Skeleton } from '@heroui/react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestDetail } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import { loadExamDraft } from '@/lib/exam/draft';
import {
  createInitialState,
  examReducer,
  isSectionLocked,
  type ExamAction,
  type ExamState,
} from '@/lib/exam/reducer';
import { partSequence } from '@/lib/exam/structure';

import { ExamHeader } from './examHeader';
import { PartBanner } from './partBanner';
import { PartView, type FocusRequest } from './partView';
import { QuestionNavigator } from './questionNavigator';
import { TimeUpModal } from './timeUpModal';
import { useExamPersistence } from './useExamPersistence';
import { useSectionTimer } from './useSectionTimer';

type RunnerState = {
  exam: ExamState;
  restored: boolean;
  timeUpOpen: boolean;
};
type RunnerAction =
  | ExamAction
  | { type: 'hydrate'; draft: ExamState | null }
  | { type: 'closeTimeUp' };

export function ExamRunner({ test }: { test: StudentTestDetail }) {
  const [{ exam: state, restored, timeUpOpen }, dispatch] = useReducer(
    (s: RunnerState, a: RunnerAction): RunnerState => {
      if (a.type === 'hydrate') {
        return {
          ...s,
          exam: a.draft
            ? examReducer(test, s.exam, { type: 'restore', state: a.draft })
            : s.exam,
          restored: true,
        };
      }
      if (a.type === 'closeTimeUp') return { ...s, timeUpOpen: false };
      const exam = examReducer(test, s.exam, a);
      // Only a tick that crosses zero opens the dialog; a restored out-of-time section stays quietly locked.
      const expired =
        a.type === 'tick' &&
        s.exam.remaining[s.exam.sectionId] > 0 &&
        exam.remaining[exam.sectionId] === 0;
      return { ...s, exam, timeUpOpen: s.timeUpOpen || expired };
    },
    test,
    (t): RunnerState => ({
      exam: createInitialState(t),
      restored: false,
      timeUpOpen: false,
    }),
  );
  const [focus, setFocus] = useState<
    (FocusRequest & { sectionId: number; partId: number | null }) | null
  >(null);
  // Never reset: PartView only re-triggers on a new seq, even after the request was cleared.
  const focusSeq = useRef(0);

  // localStorage is unavailable during SSR, so the draft can only be read after mount.
  useEffect(() => {
    dispatch({ type: 'hydrate', draft: loadExamDraft(test.slug) });
  }, [test.slug]);

  useExamPersistence(test.slug, state, restored);

  const sections = [...test.testSections].sort((a, b) => a.order - b.order);
  const section = sections.find((s) => s.id === state.sectionId) ?? sections[0];
  const parts = [...section.testParts].sort((a, b) => a.order - b.order);
  const partIndex = parts.findIndex((p) => p.id === state.partId);
  const part = parts[partIndex] ?? null;

  const remaining = state.remaining[section.id] ?? null;
  const locked = isSectionLocked(state, section.id);

  const onTick = useCallback(
    (seconds: number) => dispatch({ type: 'tick', seconds }),
    [],
  );
  useSectionTimer(restored && remaining !== null && remaining > 0, onTick);

  const sequence = partSequence(test);
  const position = sequence.findIndex(
    (ref) => ref.sectionId === state.sectionId && ref.partId === state.partId,
  );

  const nextSection = sections[sections.indexOf(section) + 1];

  if (!restored) {
    return (
      <div data-testid="exam-loading" className="flex h-dvh flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="w-full flex-1 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <ExamHeader
        test={test}
        sectionId={section.id}
        remaining={remaining}
        onSelectSection={(id) => {
          setFocus(null);
          dispatch({ type: 'goTo', sectionId: id });
        }}
        exitHref={ROUTES.test(test.slug)}
      />
      {part && <PartBanner part={part} index={partIndex} />}
      <div className="flex min-h-0 flex-1 flex-col">
        <PartView
          key={`${section.id}-${part?.id ?? 'none'}`}
          part={part}
          index={Math.max(partIndex, 0)}
          answers={state.answers[section.id] ?? {}}
          onAnswer={(n: number, value: Answer) =>
            dispatch({ type: 'answer', n, value })
          }
          readOnly={locked}
          flagged={state.flagged[section.id] ?? []}
          onToggleFlag={(n) => dispatch({ type: 'toggleFlag', n })}
          focusRequest={
            focus?.sectionId === section.id && focus.partId === state.partId
              ? focus
              : null
          }
        />
      </div>
      <QuestionNavigator
        section={section}
        partId={state.partId}
        answers={state.answers[section.id] ?? {}}
        flagged={state.flagged[section.id] ?? []}
        onSelect={(partId, from) => {
          dispatch({ type: 'goTo', sectionId: section.id, partId });
          setFocus({
            n: from,
            seq: ++focusSeq.current,
            sectionId: section.id,
            partId,
          });
        }}
        onStep={(dir) => {
          setFocus(null);
          dispatch({ type: 'step', dir });
        }}
        canPrev={position > 0}
        canNext={position !== -1 && position < sequence.length - 1}
      />
      <TimeUpModal
        isOpen={timeUpOpen}
        onReview={() => dispatch({ type: 'closeTimeUp' })}
        onNextSection={
          nextSection
            ? () => {
                setFocus(null);
                dispatch({ type: 'closeTimeUp' });
                dispatch({ type: 'goTo', sectionId: nextSection.id });
              }
            : null
        }
      />
    </div>
  );
}
