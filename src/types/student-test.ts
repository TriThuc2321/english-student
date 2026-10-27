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

export type StudentTestQuestion = {
  id: number;
  numberFrom: number;
  numberTo: number;
  order: number;
};

export type StudentTestQuestionGroup = {
  id: number;
  order: number;
  questions: StudentTestQuestion[];
};

export type StudentTestPart = {
  id: number;
  order: number;
  title: string | null;
  questionGroups: StudentTestQuestionGroup[];
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
