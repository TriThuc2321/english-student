export type ExamType =
  | 'IELTS_ACADEMIC'
  | 'IELTS_GENERAL'
  | 'TOEIC_LR'
  | 'TOEIC_SW';

export type SkillType = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

export type Paginated<T> = {
  data: T[];
  meta: { page: number; take: number; totalCount: number };
};

export type StudentTestSection = {
  id: number;
  skill: SkillType;
  order: number;
  durationMinutes: number | null;
};

export type StudentTestListItem = {
  id: number;
  slug: string;
  examType: ExamType;
  title: string;
  source: string | null;
  durationMinutes: number | null;
  publishedAt: string | null;
  testSections: StudentTestSection[];
};

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_CHOICE_MULTI'
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_INFORMATION'
  | 'MATCHING_FEATURES'
  | 'MATCHING_SENTENCE_ENDINGS'
  | 'CLASSIFICATION'
  | 'FORM_COMPLETION'
  | 'SENTENCE_COMPLETION'
  | 'SUMMARY_COMPLETION'
  | 'NOTE_COMPLETION'
  | 'TABLE_COMPLETION'
  | 'FLOW_CHART_COMPLETION'
  | 'DIAGRAM_LABELLING'
  | 'MAP_LABELLING'
  | 'PLAN_LABELLING'
  | 'SHORT_ANSWER'
  | 'PHOTO_DESCRIPTION'
  | 'QUESTION_RESPONSE'
  | 'TEXT_COMPLETION'
  | 'READ_ALOUD'
  | 'DESCRIBE_PICTURE'
  | 'RESPOND_TO_QUESTIONS'
  | 'RESPOND_USING_INFO'
  | 'EXPRESS_OPINION'
  | 'WRITE_SENTENCE_PICTURE'
  | 'RESPOND_WRITTEN_REQUEST'
  | 'OPINION_ESSAY';

export type MarkedBy = 'ALPHABET' | 'NUMBER' | 'NONE';

export type MediaKind = 'AUDIO' | 'IMAGE';

export type StudentMedia = {
  id: number;
  kind: MediaKind;
  mimeType: string | null;
  durationMs: number | null;
  url: string;
};

export type StudentParagraph = {
  id: number;
  content: string;
  order: number;
};

export type StudentPassage = {
  id: number;
  title: string;
  subtitle: string | null;
  markedBy: MarkedBy;
  paragraphs: StudentParagraph[];
};

export type Option = { key: string; text?: string };

export type GroupContent = {
  options?: Option[];
  allowReuse?: boolean;
  template?: string;
  table?: { headers?: string[]; rows: string[][] };
  info?: { title?: string; rows: string[][] };
};

export type QuestionContent = {
  options?: Option[];
  prepSeconds?: number;
  responseSeconds?: number;
};

export type StudentQuestion = {
  id: number;
  numberFrom: number;
  numberTo: number;
  order: number;
  prompt: string | null;
  content: QuestionContent | null;
  audioStartMs: number | null;
  audio: StudentMedia | null;
  image: StudentMedia | null;
};

export type StudentQuestionGroup = {
  id: number;
  order: number;
  questionType: QuestionType;
  instruction: string | null;
  wordLimit: number | null;
  content: GroupContent | null;
  audio: StudentMedia | null;
  image: StudentMedia | null;
  passages: StudentPassage[];
  questions: StudentQuestion[];
};

export type StudentTestPart = {
  id: number;
  order: number;
  title: string | null;
  instruction: string | null;
  audio: StudentMedia | null;
  audioStartMs: number | null;
  audioEndMs: number | null;
  passage: StudentPassage | null;
  questionGroups: StudentQuestionGroup[];
};

export type StudentTestSectionDetail = StudentTestSection & {
  testParts: StudentTestPart[];
};

export type StudentTestDetail = Omit<StudentTestListItem, 'testSections'> & {
  testSections: StudentTestSectionDetail[];
};

export type Profile = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
};
