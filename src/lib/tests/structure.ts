import type { StudentTestSectionDetail } from '@/types/student-test';

export const countSectionQuestions = (section: StudentTestSectionDetail) =>
  section.testParts
    .flatMap((part) => part.questionGroups)
    .flatMap((group) => group.questions)
    .reduce((sum, q) => sum + q.numberTo - q.numberFrom + 1, 0);
