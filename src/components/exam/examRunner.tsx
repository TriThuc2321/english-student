'use client';

import { Skeleton } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { Answer } from '@/lib/exam/structure';
import type { StudentTestDetail } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import { draftMatchesSections, loadExamDraft } from '@/lib/exam/draft';
import {
  createInitialState,
  examReducer,
  isSectionLocked,
  type ExamAction,
  type ExamState,
} from '@/lib/exam/reducer';
import { partSequence } from '@/lib/exam/structure';

import { ExamHeader } from './examHeader';
import { PartView, type FocusRequest } from './partView';
import { partGroups, QuestionNavigator } from './questionNavigator';
import { SubmitModal } from './submitModal';
import { TimeUpModal } from './timeUpModal';
import { useExamPersistence } from './useExamPersistence';
import { useExamTextSize } from './useExamTextSize';
import { useSectionTimer } from './useSectionTimer';
import { useTimeWarnings } from './useTimeWarnings';

type RunnerState = {
  exam: ExamState;
  restored: boolean;
  timeUpOpen: boolean;
};
type RunnerAction =
  | ExamAction
  | { type: 'hydrate'; draft: ExamState | null }
  | { type: 'closeTimeUp' };

type ExamRunnerProps = {
  test: StudentTestDetail;
  // Set when the attempt covers only some sections (practice mode); test already holds just those.
  sectionIds?: number[] | null;
};

export function ExamRunner({ test, sectionIds = null }: ExamRunnerProps) {
  const t = useTranslations();
  const router = useRouter();
  const [{ exam: state, restored, timeUpOpen }, dispatch] = useReducer(
    (s: RunnerState, a: RunnerAction): RunnerState => {
      if (a.type === 'hydrate') {
        return {
          ...s,
          exam:
            a.draft && draftMatchesSections(a.draft, sectionIds)
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
  const [submitOpen, setSubmitOpen] = useState(false);
  const [textSize, setTextSize] = useExamTextSize();
  const [active, setActive] = useState<{
    sectionId: number;
    n: number;
  } | null>(null);
  // Never reset: PartView only re-triggers on a new seq, even after the request was cleared.
  const focusSeq = useRef(0);

  // localStorage is unavailable during SSR, so the draft can only be read after mount.
  useEffect(() => {
    dispatch({ type: 'hydrate', draft: loadExamDraft(test.slug) });
  }, [test.slug]);

  const saveStatus = useExamPersistence(test.slug, state, restored, sectionIds);

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

  useTimeWarnings(section.id, remaining);

  const sequence = partSequence(test).filter(
    (ref) => ref.sectionId === section.id,
  );
  const position = sequence.findIndex((ref) => ref.partId === state.partId);

  const sectionName = (id: number) => {
    const skill = sections.find((s) => s.id === id)?.skill;
    return skill ? t(`exam.skill.${skill}`) : '';
  };
  // After the time-up tick the current section is locked, so the next open one is where Continue goes.
  const nextSection = sections.find(
    (s) => s.id !== section.id && !isSectionLocked(state, s.id),
  );
  const exitHref = ROUTES.test(test.slug);

  const sectionAnswers = state.answers[section.id] ?? {};
  const sectionFlagged = state.flagged[section.id] ?? [];
  const groups = partGroups(section, sectionAnswers);
  const allNumbers = groups.flatMap((g) => g.numbers);

  const goToQuestion = (partId: number, from: number) => {
    dispatch({ type: 'goTo', sectionId: section.id, partId });
    setFocus({
      n: from,
      seq: ++focusSeq.current,
      sectionId: section.id,
      partId,
    });
  };

  const submitSection = () => {
    setSubmitOpen(false);
    setFocus(null);
    if (!nextSection) router.push(exitHref);
    dispatch({ type: 'submitSection' });
  };

  const continueAfterTimeUp = () => {
    setFocus(null);
    dispatch({ type: 'closeTimeUp' });
    if (nextSection) dispatch({ type: 'goTo', sectionId: nextSection.id });
    else router.push(exitHref);
  };

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
    <div className="bg-background flex h-dvh flex-col">
      <ExamHeader
        test={test}
        practice={sectionIds !== null}
        sectionId={section.id}
        submitted={state.submitted}
        remaining={remaining}
        saveStatus={saveStatus}
        textSize={textSize}
        onTextSize={setTextSize}
        onSubmit={locked ? null : () => setSubmitOpen(true)}
        exitHref={exitHref}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <PartView
          key={`${section.id}-${part?.id ?? 'none'}`}
          part={part}
          index={Math.max(partIndex, 0)}
          answers={sectionAnswers}
          onAnswer={(n: number, value: Answer) =>
            dispatch({ type: 'answer', n, value })
          }
          readOnly={locked}
          flagged={sectionFlagged}
          onToggleFlag={(n) => dispatch({ type: 'toggleFlag', n })}
          focusRequest={
            focus?.sectionId === section.id && focus.partId === state.partId
              ? focus
              : null
          }
          onActiveQuestion={(n) => setActive({ sectionId: section.id, n })}
          textSize={textSize}
        />
      </div>
      <QuestionNavigator
        section={section}
        partId={state.partId}
        activeQuestion={active?.sectionId === section.id ? active.n : null}
        answers={sectionAnswers}
        flagged={sectionFlagged}
        onSelect={goToQuestion}
        onStep={(dir) => {
          setFocus(null);
          dispatch({ type: 'step', dir });
        }}
        canPrev={position > 0}
        canNext={position !== -1 && position < sequence.length - 1}
      />
      <SubmitModal
        isOpen={submitOpen && !locked}
        sectionName={sectionName(section.id)}
        groups={groups}
        flagged={sectionFlagged}
        remaining={remaining}
        onClose={() => setSubmitOpen(false)}
        onConfirm={submitSection}
        onGoTo={goToQuestion}
      />
      <TimeUpModal
        isOpen={timeUpOpen}
        sectionName={sectionName(section.id)}
        answered={allNumbers.filter((x) => x.answered).length}
        total={allNumbers.length}
        nextSectionName={nextSection ? sectionName(nextSection.id) : null}
        onContinue={continueAfterTimeUp}
      />
    </div>
  );
}
