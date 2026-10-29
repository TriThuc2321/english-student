import { describe, expect, it } from 'vitest';

import type {
  QuestionType,
  StudentPassage,
  StudentQuestion,
  StudentQuestionGroup,
} from '@/types/student-test';

import { paragraphLabel, toGroupView } from './group-view';
import { QUESTION_VIEWS } from './question-views';

const ALL_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'MULTIPLE_CHOICE_MULTI',
  'TRUE_FALSE_NOT_GIVEN',
  'YES_NO_NOT_GIVEN',
  'MATCHING_HEADINGS',
  'MATCHING_INFORMATION',
  'MATCHING_FEATURES',
  'MATCHING_SENTENCE_ENDINGS',
  'CLASSIFICATION',
  'FORM_COMPLETION',
  'SENTENCE_COMPLETION',
  'SUMMARY_COMPLETION',
  'NOTE_COMPLETION',
  'TABLE_COMPLETION',
  'FLOW_CHART_COMPLETION',
  'DIAGRAM_LABELLING',
  'MAP_LABELLING',
  'PLAN_LABELLING',
  'SHORT_ANSWER',
  'PHOTO_DESCRIPTION',
  'QUESTION_RESPONSE',
  'TEXT_COMPLETION',
  'READ_ALOUD',
  'DESCRIBE_PICTURE',
  'RESPOND_TO_QUESTIONS',
  'RESPOND_USING_INFO',
  'EXPRESS_OPINION',
  'WRITE_SENTENCE_PICTURE',
  'RESPOND_WRITTEN_REQUEST',
  'OPINION_ESSAY',
];

const q = (
  id: number,
  order: number,
  numberFrom: number,
  numberTo = numberFrom,
): StudentQuestion => ({
  id,
  order,
  numberFrom,
  numberTo,
  prompt: null,
  content: null,
  audioStartMs: null,
  audio: null,
  image: null,
});

const passage = (
  id: number,
  markedBy: StudentPassage['markedBy'],
  texts: string[],
): StudentPassage => ({
  id,
  title: `P${id}`,
  subtitle: null,
  markedBy,
  paragraphs: texts.map((content, i) => ({
    id: id * 10 + i,
    content,
    order: i,
  })),
});

const group = (
  questionType: QuestionType,
  overrides: Partial<StudentQuestionGroup> = {},
): StudentQuestionGroup => ({
  id: 1,
  order: 1,
  questionType,
  instruction: null,
  wordLimit: null,
  content: null,
  audio: null,
  image: null,
  passages: [],
  questions: [],
  ...overrides,
});

describe('paragraphLabel', () => {
  it('labels by markedBy', () => {
    expect(paragraphLabel('ALPHABET', 1)).toBe('B');
    expect(paragraphLabel('NUMBER', 1)).toBe('2');
    expect(paragraphLabel('NONE', 0)).toBeNull();
  });

  it('falls back to a number past Z', () => {
    expect(paragraphLabel('ALPHABET', 26)).toBe('27');
  });
});

describe('toGroupView', () => {
  it('sorts questions by order and maps number range', () => {
    const view = toGroupView(
      group('SHORT_ANSWER', { questions: [q(2, 2, 5, 6), q(1, 1, 3)] }),
    );
    expect(view.questions.map((x) => [x.n, x.nTo])).toEqual([
      [3, 3],
      [5, 6],
    ]);
  });

  it('applies view hints', () => {
    const view = toGroupView(group('MATCHING_HEADINGS'));
    expect(view.view).toBe('matching');
    expect(view.boxTitle).toBe('headings');
  });

  it('turns TEXT_COMPLETION paragraphs into passageText', () => {
    const view = toGroupView(
      group('TEXT_COMPLETION', {
        passages: [passage(1, 'NONE', ['Dear {{131}} and {{ 132 }}'])],
      }),
    );
    expect(view.passageText).toBe('Dear [[131]] and [[132]]');
    expect(view.passages).toEqual([]);
  });

  it('keeps passageText null for other types', () => {
    expect(toGroupView(group('SHORT_ANSWER')).passageText).toBeNull();
  });

  it('maps passages with labels from markedBy', () => {
    const view = toGroupView(
      group('MATCHING_INFORMATION', {
        passages: [
          passage(1, 'ALPHABET', ['a', 'b']),
          passage(2, 'NUMBER', ['c']),
        ],
      }),
    );
    expect(view.passages).toHaveLength(2);
    expect(view.passages[0].paragraphs.map((p) => p.label)).toEqual(['A', 'B']);
    expect(view.passages[1].paragraphs[0].label).toBe('1');
  });
});

describe('QUESTION_VIEWS', () => {
  it('has an entry for every question type', () => {
    expect(ALL_TYPES).toHaveLength(30);
    for (const t of ALL_TYPES) expect(QUESTION_VIEWS[t]).toBeDefined();
  });
});
