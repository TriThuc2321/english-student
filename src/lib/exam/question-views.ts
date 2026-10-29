import type { QuestionType } from '@/types/student-test';

export type ViewKind =
  | 'mcq'
  | 'multi'
  | 'judge'
  | 'matching'
  | 'template'
  | 'sentence'
  | 'summary'
  | 'table'
  | 'diagram'
  | 'map'
  | 'short'
  | 'photo'
  | 'qresp'
  | 'textcomp'
  | 'speak'
  | 'write';

export type ViewHints = {
  view: ViewKind;
  variant?: 'form' | 'note' | 'flow';
  boxTitle?: 'headings' | 'people' | 'endings' | 'categories' | 'wordBank';
  email?: boolean;
  rows?: number;
  minWords?: number;
};

export const QUESTION_VIEWS: Record<QuestionType, ViewHints> = {
  MULTIPLE_CHOICE: { view: 'mcq' },
  MULTIPLE_CHOICE_MULTI: { view: 'multi' },
  TRUE_FALSE_NOT_GIVEN: { view: 'judge' },
  YES_NO_NOT_GIVEN: { view: 'judge' },
  MATCHING_HEADINGS: { view: 'matching', boxTitle: 'headings' },
  MATCHING_INFORMATION: { view: 'matching' },
  MATCHING_FEATURES: { view: 'matching', boxTitle: 'people' },
  MATCHING_SENTENCE_ENDINGS: { view: 'matching', boxTitle: 'endings' },
  CLASSIFICATION: { view: 'matching', boxTitle: 'categories' },
  FORM_COMPLETION: { view: 'template', variant: 'form' },
  NOTE_COMPLETION: { view: 'template', variant: 'note' },
  FLOW_CHART_COMPLETION: { view: 'template', variant: 'flow' },
  SENTENCE_COMPLETION: { view: 'sentence' },
  SUMMARY_COMPLETION: { view: 'summary', boxTitle: 'wordBank' },
  TABLE_COMPLETION: { view: 'table' },
  DIAGRAM_LABELLING: { view: 'diagram' },
  MAP_LABELLING: { view: 'map' },
  PLAN_LABELLING: { view: 'map' },
  SHORT_ANSWER: { view: 'short' },
  PHOTO_DESCRIPTION: { view: 'photo' },
  QUESTION_RESPONSE: { view: 'qresp' },
  TEXT_COMPLETION: { view: 'textcomp' },
  READ_ALOUD: { view: 'speak' },
  DESCRIBE_PICTURE: { view: 'speak' },
  RESPOND_TO_QUESTIONS: { view: 'speak' },
  RESPOND_USING_INFO: { view: 'speak' },
  EXPRESS_OPINION: { view: 'speak' },
  WRITE_SENTENCE_PICTURE: { view: 'write', rows: 2 },
  RESPOND_WRITTEN_REQUEST: { view: 'write', email: true, rows: 8 },
  OPINION_ESSAY: { view: 'write', rows: 12, minWords: 300 },
};
