import type { StudentTestDetail } from '@/types/student-test';

import { partSequence, sectionDurationSeconds, type Answer } from './structure';

export type { Answer } from './structure';

export type ExamState = {
  answers: Record<number, Record<number, Answer>>;
  sectionId: number;
  partId: number | null;
  remaining: Record<number, number>;
  flagged: Record<number, number[]>;
};

export type ExamAction =
  | { type: 'answer'; n: number; value: Answer }
  | { type: 'toggleFlag'; n: number }
  | { type: 'goTo'; sectionId: number; partId?: number | null }
  | { type: 'step'; dir: 1 | -1 }
  | { type: 'tick'; seconds: number }
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
  };
}

export function isSectionLocked(state: ExamState, sectionId: number): boolean {
  return state.remaining[sectionId] === 0;
}

function restore(test: StudentTestDetail, saved: ExamState): ExamState {
  const sequence = partSequence(test);
  const match = sequence.find(
    (ref) => ref.sectionId === saved.sectionId && ref.partId === saved.partId,
  );
  const position = match ?? sequence[0];

  const defaults = initialRemaining(test);
  const remaining: Record<number, number> = {};
  for (const id of Object.keys(defaults).map(Number)) {
    const value = saved.remaining?.[id];
    remaining[id] =
      typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : defaults[id];
  }

  return {
    answers: saved.answers ?? {},
    flagged: saved.flagged ?? {},
    sectionId: position.sectionId,
    partId: position.partId,
    remaining,
  };
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
      if (index === -1 || !target) return state;
      return { ...state, sectionId: target.sectionId, partId: target.partId };
    }
    case 'tick': {
      const current = state.remaining[state.sectionId];
      if (current === undefined) return state;
      return {
        ...state,
        remaining: {
          ...state.remaining,
          [state.sectionId]: Math.max(0, current - action.seconds),
        },
      };
    }
    case 'restore':
      return restore(test, action.state);
  }
}
