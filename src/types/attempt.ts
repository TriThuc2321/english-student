import type { ExamType, SkillType } from './student-test';

export type AttemptMode = 'FULL' | 'SECTION';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';

export type AttemptSectionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'EXPIRED';

export type AttemptResponse =
  | { key: string }
  | { keys: string[] }
  | { text: string };

export type AttemptAnswerKey =
  | { key: string }
  | { keys: string[] }
  | { accepted: string[] }
  | { sample: unknown };

export type AttemptSection = {
  id: string;
  // test_sections id
  sectionId: number;
  skill: SkillType;
  order: number;
  status: AttemptSectionStatus;
  startedAt: string | null;
  deadlineAt: string | null;
  submittedAt: string | null;
  rawScore: number | null;
  maxScore: number | null;
  scaledScore: number | null;
};

export type AttemptAnswerState = {
  questionId: number;
  response: AttemptResponse | null;
  flagged: boolean;
  answeredAt: string | null;
};

export type Attempt = {
  id: string;
  testId: number;
  testSlug: string;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  overallScore: number | null;
  serverNow: string;
  sections: AttemptSection[];
  answers: AttemptAnswerState[];
};

export type AttemptListItem = Omit<Attempt, 'answers' | 'serverNow'> & {
  test: { id: number; slug: string; title: string; examType: ExamType };
};

export type AttemptEvidence = { paragraphId?: number; quote?: string };

export type AttemptResultQuestion = {
  questionId: number;
  sectionId: number;
  numberFrom: number;
  numberTo: number;
  response: AttemptResponse | null;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  flagged: boolean;
  answer: AttemptAnswerKey;
  explanation: string | null;
  evidence: AttemptEvidence | null;
};

export type AttemptResult = {
  attempt: AttemptListItem;
  questions: AttemptResultQuestion[];
  transcripts: { mediaId: number; transcript: string }[];
};

export type StartAttemptInput = {
  testId: number;
  mode: AttemptMode;
  sectionIds?: number[];
};

export type SaveAnswerItem = {
  questionId: number;
  response: AttemptResponse | null;
  flagged?: boolean;
};

export type SaveAnswersResult = { savedAt: string; serverNow: string };

export type AttemptErrorCode =
  | 'TEST_NOT_FOUND'
  | 'ATTEMPT_NOT_FOUND'
  | 'ATTEMPT_IN_PROGRESS'
  | 'SECTION_NOT_OPEN'
  | 'ATTEMPT_CLOSED'
  | 'ATTEMPT_NOT_GRADED';
