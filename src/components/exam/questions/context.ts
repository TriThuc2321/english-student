import { createContext, useContext } from 'react';

import type { GroupViewModel } from '@/lib/exam/group-view';
import type { Answer } from '@/lib/exam/structure';
import type { ReviewItem } from '@/lib/results/view';

// Set when a graded attempt is shown back; addressed by question number like the rest of the context.
export type GroupReview = {
  item: (n: number) => ReviewItem | undefined;
  // Every number of the question that n belongs to.
  question: (n: number) => ReviewItem[];
};

// Inside a group, questions are addressed by number: numbers are unique there and templates refer to them as {{n}}.
export type ExamGroupContextValue = {
  group: GroupViewModel;
  answers: Record<number, Answer>;
  setAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  toggleFlag: (n: number) => void;
  // The DOM id the navigator scrolls to and reads focus from.
  anchorId: (n: number) => string;
  review?: GroupReview;
};

export const questionAnchorId = (questionId: number) => `q-${questionId}`;

export const ExamGroupContext = createContext<ExamGroupContextValue | null>(
  null,
);

export function useExamGroup(): ExamGroupContextValue {
  const value = useContext(ExamGroupContext);
  if (!value)
    throw new Error('useExamGroup must be used inside ExamGroupContext');
  return value;
}
