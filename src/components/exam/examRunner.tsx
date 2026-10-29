'use client';

import { Button, Skeleton } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { ExamDraft } from '@/lib/exam/draft';
import type { Answer } from '@/lib/exam/structure';
import type { Attempt } from '@/types/attempt';
import type { StudentTestDetail } from '@/types/student-test';

import { ROUTES } from '@/constants/routes';
import {
  getAttempt,
  openAttempt,
  submitAttempt,
  submitAttemptSection,
} from '@/lib/api/attempts-client';
import { ApiError } from '@/lib/api/client';
import {
  remainingFromAttempt,
  stateFromAttempt,
  type ServerExamState,
} from '@/lib/exam/attempt-sync';
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
import { useAttemptAutosave } from './useAttemptAutosave';
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
  | { type: 'hydrate'; draft: ExamDraft | null; server: ServerExamState }
  | { type: 'syncRemaining'; remaining: Record<number, number> }
  | { type: 'closeTimeUp' };

type LoadedAttempt = {
  id: string;
  baseline: Pick<ExamState, 'answers' | 'flagged'>;
};

const sectionsOf = (attempt: Attempt) =>
  attempt.mode === 'FULL'
    ? null
    : [...attempt.sections]
        .sort((a, b) => a.order - b.order)
        .map((s) => s.sectionId);

const sameSections = (a: number[] | null, b: number[] | null) =>
  (a?.join(',') ?? '') === (b?.join(',') ?? '');

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
        // The server owns answers, flags and time; the local draft only remembers where the student was.
        const position =
          a.draft && draftMatchesSections(a.draft, sectionIds)
            ? { sectionId: a.draft.sectionId, partId: a.draft.partId }
            : {};
        const saved: ExamState = {
          ...s.exam,
          ...position,
          ...a.server,
          remaining: { ...s.exam.remaining, ...a.server.remaining },
        };
        return {
          ...s,
          exam: examReducer(test, s.exam, { type: 'restore', state: saved }),
          restored: true,
        };
      }
      if (a.type === 'syncRemaining') {
        return {
          ...s,
          exam: {
            ...s.exam,
            remaining: { ...s.exam.remaining, ...a.remaining },
          },
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [attempt, setAttempt] = useState<LoadedAttempt | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadSeq, setLoadSeq] = useState(0);
  // The time-up dialog can continue twice (button and countdown); only the first closes the section.
  const closingRef = useRef(false);
  const [textSize, setTextSize] = useExamTextSize();
  const [active, setActive] = useState<{
    sectionId: number;
    n: number;
  } | null>(null);
  // Never reset: PartView only re-triggers on a new seq, even after the request was cleared.
  const focusSeq = useRef(0);

  const sectionKey = sectionIds?.join(',') ?? '';
  useEffect(() => {
    let cancelled = false;
    const ids = sectionKey ? sectionKey.split(',').map(Number) : null;
    (async () => {
      try {
        const opened = await openAttempt({
          testId: test.id,
          mode: ids ? 'SECTION' : 'FULL',
          ...(ids && { sectionIds: ids }),
        });
        if (cancelled) return;
        if (opened.status !== 'IN_PROGRESS') {
          router.replace(ROUTES.attemptResult(opened.id));
          return;
        }
        // An open attempt pins the sections it was started with.
        const pinned = sectionsOf(opened);
        if (!sameSections(pinned, ids)) {
          router.replace(ROUTES.takeTest(test.slug, pinned));
          return;
        }
        const server = stateFromAttempt(test, opened);
        setAttempt({
          id: opened.id,
          baseline: { answers: server.answers, flagged: server.flagged },
        });
        // localStorage is unavailable during SSR, so the draft can only be read after mount.
        dispatch({ type: 'hydrate', draft: loadExamDraft(test.slug), server });
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [test, sectionKey, router, loadSeq]);

  // Kept so the test overview can still show progress for the open attempt.
  const { discard: discardDraft } = useExamPersistence(
    test.slug,
    state,
    restored,
    sectionIds,
  );
  const { status: saveStatus, flush } = useAttemptAutosave(
    attempt?.id ?? null,
    test,
    state,
    attempt?.baseline ?? null,
  );

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

  // Resolves 'graded' once the whole attempt is closed and the result page is on its way.
  const closeSection = async (sectionId: number) => {
    if (!attempt) throw new Error('No attempt');
    await flush();
    const isLast = sections.every(
      (s) => s.id === sectionId || isSectionLocked(state, s.id),
    );
    let result: Attempt;
    try {
      result = isLast
        ? await submitAttempt(attempt.id)
        : await submitAttemptSection(attempt.id, sectionId);
    } catch (error) {
      // The server already closed it (deadline passed); pick up its view of the attempt.
      if (!(error instanceof ApiError) || error.status !== 409) throw error;
      result = await getAttempt(attempt.id);
    }
    if (result.status !== 'IN_PROGRESS') {
      discardDraft();
      router.push(ROUTES.attemptResult(attempt.id));
      return 'graded';
    }
    dispatch({
      type: 'syncRemaining',
      remaining: remainingFromAttempt(result),
    });
    return 'open';
  };

  const submitSection = async () => {
    setSubmitting(true);
    setSubmitError(false);
    try {
      if ((await closeSection(section.id)) === 'graded') return;
      setSubmitOpen(false);
      setFocus(null);
      dispatch({ type: 'submitSection' });
    } catch {
      setSubmitError(true);
    }
    setSubmitting(false);
  };

  const continueAfterTimeUp = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setFocus(null);
    try {
      if ((await closeSection(section.id)) === 'graded') return;
    } catch {
      // The server expires the section on its own, so the student can carry on.
      if (!nextSection) router.push(exitHref);
    } finally {
      closingRef.current = false;
    }
    dispatch({ type: 'closeTimeUp' });
    if (nextSection) dispatch({ type: 'goTo', sectionId: nextSection.id });
  };

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex h-dvh flex-col items-center justify-center gap-3 p-4 text-center"
      >
        <h1 className="text-xl font-semibold">
          {t('taking.attemptError.title')}
        </h1>
        <p className="text-muted">{t('taking.attemptError.body')}</p>
        <Button
          onPress={() => {
            setLoadError(false);
            setLoadSeq((n) => n + 1);
          }}
        >
          {t('taking.attemptError.retry')}
        </Button>
      </div>
    );
  }

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
        isSubmitting={submitting}
        hasError={submitError}
        onClose={() => {
          setSubmitOpen(false);
          setSubmitError(false);
        }}
        onConfirm={() => void submitSection()}
        onGoTo={goToQuestion}
      />
      <TimeUpModal
        isOpen={timeUpOpen}
        sectionName={sectionName(section.id)}
        answered={allNumbers.filter((x) => x.answered).length}
        total={allNumbers.length}
        nextSectionName={nextSection ? sectionName(nextSection.id) : null}
        onContinue={() => void continueAfterTimeUp()}
      />
    </div>
  );
}
