import type { StudentTestDetail } from '@/types/student-test';

import { partSequence, sectionDurationSeconds, type Answer } from './structure';

export type { Answer } from './structure';

export type ExamState = {
  answers: Record<number, Record<number, Answer>>;
  sectionId: number;
  partId: number | null;
  remaining: Record<number, number>;
  flagged: Record<number, number[]>;
  submitted: number[];
};

export type ExamAction =
  | { type: 'answer'; n: number; value: Answer }
  | { type: 'toggleFlag'; n: number }
  | { type: 'goTo'; sectionId: number; partId?: number | null }
  | { type: 'step'; dir: 1 | -1 }
  | { type: 'tick'; seconds: number }
  | { type: 'submitSection' }
  | { type: 'restore'; state: ExamState };

function initialRemaining(test: StudentTestDetail): Record<number, number> {
  const remaining: Record<number, number> = {};
  for (const section of test.testSections) {
    const seconds = sectionDurationSeconds(test, section);
    if (seconds !== null) remaining[section.id] = seconds;
  }
  return remaining;
}

export function createInitialState(test: StudentTestDetail): ExamState {
  const first = partSequence(test)[0];
  return {
    answers: {},
    sectionId: first.sectionId,
    partId: first.partId,
    remaining: initialRemaining(test),
    flagged: {},
    submitted: [],
  };
}

export function isSectionLocked(state: ExamState, sectionId: number): boolean {
  return (
    state.remaining[sectionId] === 0 || state.submitted.includes(sectionId)
  );
}

function firstPartOf(test: StudentTestDetail, sectionId: number) {
  return partSequence(test).find((ref) => ref.sectionId === sectionId);
}

// Sections are taken in order; the next one to work on is the first not yet locked.
function nextOpenSection(test: StudentTestDetail, state: ExamState) {
  return [...test.testSections]
    .sort((a, b) => a.order - b.order)
    .find((section) => !isSectionLocked(state, section.id));
}

function restore(test: StudentTestDetail, saved: ExamState): ExamState {
  const sequence = partSequence(test);
  const match = sequence.find(
    (ref) => ref.sectionId === saved.sectionId && ref.partId === saved.partId,
  );
  const position = match ?? sequence[0];

  const sectionIds = new Set(test.testSections.map((section) => section.id));
  const submitted = Array.isArray(saved.submitted)
    ? saved.submitted.filter((id) => sectionIds.has(id))
    : [];

  const defaults = initialRemaining(test);
  const remaining: Record<number, number> = {};
  for (const id of Object.keys(defaults).map(Number)) {
    const value = saved.remaining?.[id];
    remaining[id] =
      typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : defaults[id];
  }

  const restored: ExamState = {
    answers: saved.answers ?? {},
    flagged: saved.flagged ?? {},
    sectionId: position.sectionId,
    partId: position.partId,
    remaining,
    submitted,
  };
  if (!isSectionLocked(restored, restored.sectionId)) return restored;
  const open = nextOpenSection(test, restored);
  const target = open && firstPartOf(test, open.id);
  return target ? { ...restored, ...target } : restored;
}

export function examReducer(
  test: StudentTestDetail,
  state: ExamState,
  action: ExamAction,
): ExamState {
  switch (action.type) {
    case 'answer': {
      if (isSectionLocked(state, state.sectionId)) return state;
      return {
        ...state,
        answers: {
          ...state.answers,
          [state.sectionId]: {
            ...state.answers[state.sectionId],
            [action.n]: action.value,
          },
        },
      };
    }
    case 'toggleFlag': {
      const current = state.flagged[state.sectionId] ?? [];
      const next = current.includes(action.n)
        ? current.filter((n) => n !== action.n)
        : [...current, action.n];
      const flagged = { ...state.flagged };
      if (next.length === 0) delete flagged[state.sectionId];
      else flagged[state.sectionId] = next;
      return { ...state, flagged };
    }
    case 'goTo': {
      const sequence = partSequence(test).filter(
        (ref) => ref.sectionId === action.sectionId,
      );
      if (sequence.length === 0) return state;
      if (
        action.sectionId !== state.sectionId &&
        isSectionLocked(state, action.sectionId)
      ) {
        return state;
      }
      const target =
        action.partId === undefined
          ? sequence[0]
          : sequence.find((ref) => ref.partId === action.partId);
      if (!target) return state;
      return { ...state, sectionId: target.sectionId, partId: target.partId };
    }
    case 'step': {
      const sequence = partSequence(test);
      const index = sequence.findIndex(
        (ref) =>
          ref.sectionId === state.sectionId && ref.partId === state.partId,
      );
      const target = sequence[index + action.dir];
      if (index === -1 || !target || target.sectionId !== state.sectionId) {
        return state;
      }
      return { ...state, sectionId: target.sectionId, partId: target.partId };
    }
    case 'tick': {
      const current = state.remaining[state.sectionId];
      if (current === undefined || current === 0) return state;
      const next = Math.max(0, current - action.seconds);
      return {
        ...state,
        remaining: { ...state.remaining, [state.sectionId]: next },
        submitted:
          next === 0 && !state.submitted.includes(state.sectionId)
            ? [...state.submitted, state.sectionId]
            : state.submitted,
      };
    }
    case 'submitSection': {
      if (state.submitted.includes(state.sectionId)) return state;
      const submitted = {
        ...state,
        submitted: [...state.submitted, state.sectionId],
      };
      const open = nextOpenSection(test, submitted);
      const target = open && firstPartOf(test, open.id);
      return target ? { ...submitted, ...target } : submitted;
    }
    case 'restore':
      return restore(test, action.state);
  }
}
