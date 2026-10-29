import type {
  GroupContent,
  MarkedBy,
  QuestionContent,
  QuestionType,
  StudentMedia,
  StudentPassage,
  StudentQuestionGroup,
} from '@/types/student-test';

import { QUESTION_VIEWS, type ViewHints } from './question-views';

export type PassageView = {
  title: string;
  subtitle: string | null;
  paragraphs: { label: string | null; text: string }[];
};

export type QuestionView = {
  n: number;
  nTo: number;
  prompt: string | null;
  content: QuestionContent | null;
  audio: StudentMedia | null;
  image: StudentMedia | null;
  audioStartMs: number | null;
};

export type GroupViewModel = ViewHints & {
  id: number;
  type: QuestionType;
  instruction: string | null;
  wordLimit: number | null;
  content: GroupContent | null;
  audio: StudentMedia | null;
  image: StudentMedia | null;
  passages: PassageView[];
  passageText: string | null;
  questions: QuestionView[];
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLACEHOLDER = /\{\{\s*(\d+)\s*\}\}/g;

export function paragraphLabel(
  markedBy: MarkedBy,
  index: number,
): string | null {
  if (markedBy === 'ALPHABET') return LETTERS[index] ?? String(index + 1);
  if (markedBy === 'NUMBER') return String(index + 1);
  return null;
}

export function toPassageView(passage: StudentPassage): PassageView {
  const paragraphs = [...passage.paragraphs]
    .sort((a, b) => a.order - b.order)
    .map((p, i) => ({
      label: paragraphLabel(passage.markedBy, i),
      text: p.content,
    }));
  return { title: passage.title, subtitle: passage.subtitle, paragraphs };
}

export function toGroupView(group: StudentQuestionGroup): GroupViewModel {
  const isTextCompletion = group.questionType === 'TEXT_COMPLETION';
  const passageText = isTextCompletion
    ? group.passages
        .flatMap((p) => [...p.paragraphs].sort((a, b) => a.order - b.order))
        .map((p) => p.content.replace(PLACEHOLDER, '[[$1]]'))
        .join('\n\n')
    : null;

  return {
    ...QUESTION_VIEWS[group.questionType],
    id: group.id,
    type: group.questionType,
    instruction: group.instruction,
    wordLimit: group.wordLimit,
    content: group.content,
    audio: group.audio,
    image: group.image,
    passages: isTextCompletion ? [] : group.passages.map(toPassageView),
    passageText,
    questions: [...group.questions]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        n: q.numberFrom,
        nTo: q.numberTo,
        prompt: q.prompt,
        content: q.content,
        audio: q.audio,
        image: q.image,
        audioStartMs: q.audioStartMs,
      })),
  };
}
