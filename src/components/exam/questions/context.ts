import { createContext, useContext } from 'react';

import type { GroupViewModel } from '@/lib/exam/group-view';
import type { Answer } from '@/lib/exam/structure';

export type ExamGroupContextValue = {
  group: GroupViewModel;
  answers: Record<number, Answer>;
  setAnswer: (n: number, value: Answer) => void;
  readOnly: boolean;
  flagged: number[];
  toggleFlag: (n: number) => void;
};

export const ExamGroupContext = createContext<ExamGroupContextValue | null>(
  null,
);

export function useExamGroup(): ExamGroupContextValue {
  const value = useContext(ExamGroupContext);
  if (!value)
    throw new Error('useExamGroup must be used inside ExamGroupContext');
  return value;
}
