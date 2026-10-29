import type { Attempt, AttemptResponse, SaveAnswerItem } from '@/types/attempt';
import type {
  QuestionType,
  StudentQuestion,
  StudentQuestionGroup,
  StudentTestDetail,
} from '@/types/student-test';

import type { ExamState } from './reducer';
import type { Answer } from './structure';

type ResponseField = 'key' | 'keys' | 'text' | 'summary' | null;

// Mirrors QUESTION_ANSWER_KINDS in english-service; null types are graded by a person and can't be saved.
const RESPONSE_FIELDS: Record<QuestionType, ResponseField> = {
  MULTIPLE_CHOICE: 'key',
  MULTIPLE_CHOICE_MULTI: 'keys',
  TRUE_FALSE_NOT_GIVEN: 'key',
  YES_NO_NOT_GIVEN: 'key',
  MATCHING_HEADINGS: 'key',
  MATCHING_INFORMATION: 'key',
  MATCHING_FEATURES: 'key',
  MATCHING_SENTENCE_ENDINGS: 'key',
  CLASSIFICATION: 'key',
  FORM_COMPLETION: 'text',
  SENTENCE_COMPLETION: 'text',
  SUMMARY_COMPLETION: 'summary',
  NOTE_COMPLETION: 'text',
  TABLE_COMPLETION: 'text',
  FLOW_CHART_COMPLETION: 'text',
  DIAGRAM_LABELLING: 'text',
  MAP_LABELLING: 'key',
  PLAN_LABELLING: 'key',
  SHORT_ANSWER: 'text',
  PHOTO_DESCRIPTION: 'key',
  QUESTION_RESPONSE: 'key',
  TEXT_COMPLETION: 'key',
  READ_ALOUD: null,
  DESCRIBE_PICTURE: null,
  RESPOND_TO_QUESTIONS: null,
  RESPOND_USING_INFO: null,
  EXPRESS_OPINION: null,
  WRITE_SENTENCE_PICTURE: null,
  RESPOND_WRITTEN_REQUEST: null,
  OPINION_ESSAY: null,
};

// The API rejects longer text, and one rejected item fails the whole batch.
const MAX_TEXT_LENGTH = 255;

export const SAVE_BATCH_SIZE = 200;

type IndexedQuestion = {
  question: StudentQuestion;
  group: StudentQuestionGroup;
  sectionId: number;
};

export function indexTestQuestions(test: StudentTestDetail) {
  const list: IndexedQuestion[] = [];
  for (const section of test.testSections) {
    for (const part of section.testParts) {
      for (const group of part.questionGroups) {
        for (const question of group.questions) {
          list.push({ question, group, sectionId: section.id });
        }
      }
    }
  }
  return list;
}

function fieldOf(group: StudentQuestionGroup): 'key' | 'keys' | 'text' | null {
  const field = RESPONSE_FIELDS[group.questionType];
  if (field !== 'summary') return field;
  return group.content?.options?.length ? 'key' : 'text';
}

// null clears a saved answer.
export function responseFor(
  group: StudentQuestionGroup,
  value: Answer | undefined,
): AttemptResponse | null {
  const field = fieldOf(group);
  if (field === null || value === undefined) return null;
  if (field === 'keys') {
    const keys = [...new Set(Array.isArray(value) ? value : [value])].filter(
      (k) => k.trim(),
    );
    return keys.length ? { keys } : null;
  }
  const single = Array.isArray(value) ? (value[0] ?? '') : value;
  const trimmed = single.trim();
  if (!trimmed) return null;
  return field === 'key'
    ? { key: trimmed }
    : { text: trimmed.slice(0, MAX_TEXT_LENGTH) };
}

function answerFromResponse(response: AttemptResponse | null): Answer | null {
  if (!response) return null;
  if ('key' in response) return response.key;
  if ('keys' in response) return response.keys;
  return response.text;
}

// The part of the exam state that the server owns; position stays local.
export type ServerExamState = Pick<
  ExamState,
  'answers' | 'flagged' | 'remaining' | 'submitted'
>;

export function remainingFromAttempt(
  attempt: Pick<Attempt, 'sections' | 'deadlineAt' | 'serverNow'>,
): Record<number, number> {
  const now = Date.parse(attempt.serverNow);
  const remaining: Record<number, number> = {};
  for (const section of attempt.sections) {
    if (section.status === 'SUBMITTED' || section.status === 'EXPIRED') {
      remaining[section.sectionId] = 0;
      continue;
    }
    if (section.status !== 'IN_PROGRESS') continue;
    const deadline = section.deadlineAt ?? attempt.deadlineAt;
    if (deadline === null) continue;
    remaining[section.sectionId] = Math.max(
      0,
      Math.floor((Date.parse(deadline) - now) / 1000),
    );
  }
  return remaining;
}

export function submittedFromAttempt(attempt: Pick<Attempt, 'sections'>) {
  return attempt.sections
    .filter((s) => s.status === 'SUBMITTED' || s.status === 'EXPIRED')
    .map((s) => s.sectionId);
}

export function stateFromAttempt(
  test: StudentTestDetail,
  attempt: Attempt,
): ServerExamState {
  const byId = new Map(indexTestQuestions(test).map((q) => [q.question.id, q]));
  const answers: ExamState['answers'] = {};
  const flagged: ExamState['flagged'] = {};

  for (const saved of attempt.answers) {
    const q = byId.get(saved.questionId);
    if (!q) continue;
    const n = q.question.numberFrom;
    const value = answerFromResponse(saved.response);
    if (value !== null) {
      answers[q.sectionId] = { ...answers[q.sectionId], [n]: value };
    }
    if (saved.flagged) {
      flagged[q.sectionId] = [...(flagged[q.sectionId] ?? []), n];
    }
  }

  return {
    answers,
    flagged,
    remaining: remainingFromAttempt(attempt),
    submitted: submittedFromAttempt(attempt),
  };
}

const sameResponse = (a: AttemptResponse | null, b: AttemptResponse | null) =>
  JSON.stringify(a) === JSON.stringify(b);

// Changes since the last saved state, skipping sections that are already closed on the server.
export function diffAnswers(
  test: StudentTestDetail,
  saved: Pick<ExamState, 'answers' | 'flagged'>,
  next: Pick<ExamState, 'answers' | 'flagged' | 'submitted'>,
): SaveAnswerItem[] {
  const items: SaveAnswerItem[] = [];
  for (const { question, group, sectionId } of indexTestQuestions(test)) {
    if (next.submitted.includes(sectionId)) continue;
    const n = question.numberFrom;
    const response = responseFor(group, next.answers[sectionId]?.[n]);
    const flagged = (next.flagged[sectionId] ?? []).includes(n);
    const responseChanged = !sameResponse(
      responseFor(group, saved.answers[sectionId]?.[n]),
      response,
    );
    const flagChanged =
      (saved.flagged[sectionId] ?? []).includes(n) !== flagged;
    if (!responseChanged && !flagChanged) continue;
    items.push({ questionId: question.id, response, flagged });
  }
  return items;
}

export function chunk<T>(items: T[], size = SAVE_BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
