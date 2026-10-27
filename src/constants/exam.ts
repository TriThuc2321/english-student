import type { ExamType, SkillType } from '@/types/student-test';

export const EXAM_TYPES: readonly ExamType[] = [
  'IELTS_ACADEMIC',
  'IELTS_GENERAL',
  'TOEIC_LR',
  'TOEIC_SW',
];

const IELTS_SKILLS: readonly SkillType[] = [
  'LISTENING',
  'READING',
  'WRITING',
  'SPEAKING',
];

export const EXAM_SKILLS: Record<ExamType, readonly SkillType[]> = {
  IELTS_ACADEMIC: IELTS_SKILLS,
  IELTS_GENERAL: IELTS_SKILLS,
  TOEIC_LR: ['LISTENING', 'READING'],
  TOEIC_SW: ['SPEAKING', 'WRITING'],
};

export const isExamType = (value: unknown): value is ExamType =>
  (EXAM_TYPES as readonly unknown[]).includes(value);

// Full class strings so Tailwind can detect them at build time.
const IELTS_CLASSES = {
  soft: 'bg-exam-ielts-soft text-exam-ielts',
  bar: 'bg-exam-ielts',
} as const;
const TOEIC_CLASSES = {
  soft: 'bg-exam-toeic-soft text-exam-toeic',
  bar: 'bg-exam-toeic',
} as const;

export const EXAM_CLASSES: Record<ExamType, { soft: string; bar: string }> = {
  IELTS_ACADEMIC: IELTS_CLASSES,
  IELTS_GENERAL: IELTS_CLASSES,
  TOEIC_LR: TOEIC_CLASSES,
  TOEIC_SW: TOEIC_CLASSES,
};

export const SKILL_CLASSES: Record<SkillType, string> = {
  LISTENING: 'bg-skill-listening-soft text-skill-listening',
  READING: 'bg-skill-reading-soft text-skill-reading',
  WRITING: 'bg-skill-writing-soft text-skill-writing',
  SPEAKING: 'bg-skill-speaking-soft text-skill-speaking',
};
