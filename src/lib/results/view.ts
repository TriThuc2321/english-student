import type {
  AttemptListItem,
  AttemptResponse,
  AttemptResult,
  AttemptResultQuestion,
} from '@/types/attempt';
import type {
  ExamType,
  Option,
  StudentTestSectionDetail,
  QuestionType,
  SkillType,
  StudentPassage,
  StudentQuestion,
  StudentQuestionGroup,
  StudentTestDetail,
  StudentTestPart,
} from '@/types/student-test';

export type NumberStatus = 'correct' | 'incorrect' | 'blank' | 'pending';

export type AnswerPart = { key: string | null; text: string | null };

export type ReviewItem = {
  n: number;
  from: number;
  to: number;
  questionType: QuestionType | null;
  prompt: string | null;
  status: NumberStatus;
  yourAnswer: AnswerPart[];
  // null for answers graded by a person (Writing/Speaking samples).
  correctAnswer: AnswerPart[] | null;
  alsoAccepted: string[];
  explanation: string | null;
  evidence: { quote: string | null; paragraph: string | null } | null;
};

export type Breakdown = {
  id: string;
  label: { partTitle: string | null; partOrder: number } | QuestionType;
  correct: number;
  total: number;
  pct: number;
  weak: boolean;
};

export type StatusCounts = Record<NumberStatus, number>;

export type SectionTranscript = {
  mediaId: number;
  partTitle: string | null;
  partOrder: number;
  transcript: string;
};

export type SectionResult = {
  sectionId: number;
  skill: SkillType;
  items: ReviewItem[];
  counts: StatusCounts;
  byPart: Breakdown[];
  byType: Breakdown[];
  transcripts: SectionTranscript[];
};

export type SkillScore = {
  sectionId: number;
  skill: SkillType;
  scaledScore: number | null;
  rawScore: number | null;
  maxScore: number | null;
  pending: boolean;
};

export type TotalScore =
  | { kind: 'toeic'; score: number; max: number; parts: SkillScore[] }
  | { kind: 'ielts'; band: number; max: number };

export type ResultView = {
  examType: ExamType;
  skills: SkillScore[];
  total: TotalScore | null;
  sections: SectionResult[];
};

// A category under this share of correct answers is flagged as needing work.
export const WEAK_THRESHOLD = 60;

type QuestionContext = {
  question: StudentQuestion;
  group: StudentQuestionGroup;
  part: StudentTestPart;
};

const byOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

function indexQuestions(test: StudentTestDetail) {
  const index = new Map<number, QuestionContext>();
  for (const section of test.testSections) {
    for (const part of section.testParts) {
      for (const group of part.questionGroups) {
        for (const question of group.questions) {
          index.set(question.id, { question, group, part });
        }
      }
    }
  }
  return index;
}

const isSample = (q: AttemptResultQuestion) => 'sample' in q.answer;

function optionsOf(ctx: QuestionContext | undefined): Option[] {
  return ctx?.question.content?.options ?? ctx?.group.content?.options ?? [];
}

function choice(key: string, options: Option[]): AnswerPart {
  const text = options.find((o) => o.key === key)?.text ?? null;
  return { key, text };
}

function responseParts(
  response: AttemptResponse | null,
  options: Option[],
): AnswerPart[] {
  if (!response) return [];
  if ('key' in response) {
    return response.key.trim() ? [choice(response.key, options)] : [];
  }
  if ('keys' in response) return response.keys.map((k) => choice(k, options));
  return response.text.trim() ? [{ key: null, text: response.text }] : [];
}

function correctParts(
  q: AttemptResultQuestion,
  options: Option[],
): { parts: AnswerPart[] | null; alsoAccepted: string[] } {
  const { answer } = q;
  if ('key' in answer) {
    return { parts: [choice(answer.key, options)], alsoAccepted: [] };
  }
  if ('keys' in answer) {
    return {
      parts: answer.keys.map((k) => choice(k, options)),
      alsoAccepted: [],
    };
  }
  if ('accepted' in answer) {
    const [first, ...rest] = answer.accepted;
    return {
      parts: first === undefined ? [] : [{ key: null, text: first }],
      alsoAccepted: rest,
    };
  }
  return { parts: null, alsoAccepted: [] };
}

function numberStatus(q: AttemptResultQuestion, n: number): NumberStatus {
  if (isSample(q)) return 'pending';
  const given = q.response;
  if (!given) return 'blank';
  if ('keys' in given) {
    // A multi-answer question scores one point per right key; the points fill its numbers in order.
    const index = n - q.numberFrom;
    if (index < q.score) return 'correct';
    return index < given.keys.length ? 'incorrect' : 'blank';
  }
  if (q.isCorrect === null) return 'blank';
  return q.isCorrect ? 'correct' : 'incorrect';
}

function paragraphLabel(
  passage: StudentPassage | null | undefined,
  paragraphId: number | undefined,
): string | null {
  if (!passage || paragraphId === undefined) return null;
  const index = byOrder(passage.paragraphs).findIndex(
    (p) => p.id === paragraphId,
  );
  if (index === -1) return null;
  if (passage.markedBy === 'ALPHABET') return String.fromCharCode(65 + index);
  if (passage.markedBy === 'NUMBER') return String(index + 1);
  return null;
}

function evidenceOf(
  q: AttemptResultQuestion,
  ctx: QuestionContext | undefined,
): ReviewItem['evidence'] {
  if (!q.evidence) return null;
  const { quote, paragraphId } = q.evidence;
  const passages = ctx ? [ctx.part.passage, ...ctx.group.passages] : [];
  const paragraph =
    passages
      .map((p) => paragraphLabel(p, paragraphId))
      .find((label) => label !== null) ?? null;
  if (!quote && !paragraph) return null;
  return { quote: quote ?? null, paragraph };
}

function breakdown(
  id: string,
  label: Breakdown['label'],
  correct: number,
  total: number,
): Breakdown {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { id, label, correct, total, pct, weak: pct < WEAK_THRESHOLD };
}

// Single and multi-answer multiple choice share a label, so they share a row.
const breakdownType = (type: QuestionType): QuestionType =>
  type === 'MULTIPLE_CHOICE_MULTI' ? 'MULTIPLE_CHOICE' : type;

function sectionTranscripts(
  section: StudentTestSectionDetail | undefined,
  transcripts: Map<number, string>,
): SectionTranscript[] {
  if (!section) return [];
  const found: SectionTranscript[] = [];
  const seen = new Set<number>();
  for (const part of byOrder(section.testParts)) {
    const media = [
      part.audio,
      ...part.questionGroups.flatMap((g) => [
        g.audio,
        ...g.questions.map((q) => q.audio),
      ]),
    ];
    for (const m of media) {
      const transcript = m && transcripts.get(m.id);
      if (!m || !transcript || seen.has(m.id)) continue;
      seen.add(m.id);
      found.push({
        mediaId: m.id,
        partTitle: part.title,
        partOrder: part.order,
        transcript,
      });
    }
  }
  return found;
}

function sectionResult(
  sectionId: number,
  skill: SkillType,
  questions: AttemptResultQuestion[],
  index: Map<number, QuestionContext>,
  transcripts: SectionTranscript[],
): SectionResult {
  const items: ReviewItem[] = [];
  const counts: StatusCounts = {
    correct: 0,
    incorrect: 0,
    blank: 0,
    pending: 0,
  };
  const parts = new Map<
    number,
    { order: number; title: string | null; correct: number; total: number }
  >();
  const types = new Map<QuestionType, { correct: number; total: number }>();

  for (const q of questions) {
    const ctx = index.get(q.questionId);
    const options = optionsOf(ctx);
    const yourAnswer = responseParts(q.response, options);
    const { parts: correctAnswer, alsoAccepted } = correctParts(q, options);
    const evidence = evidenceOf(q, ctx);

    for (let n = q.numberFrom; n <= q.numberTo; n++) {
      const status = numberStatus(q, n);
      counts[status]++;
      items.push({
        n,
        from: q.numberFrom,
        to: q.numberTo,
        questionType: ctx?.group.questionType ?? null,
        prompt: ctx?.question.prompt ?? null,
        status,
        yourAnswer,
        correctAnswer,
        alsoAccepted,
        explanation: q.explanation,
        evidence,
      });
    }

    if (isSample(q) || !ctx) continue;
    const part = parts.get(ctx.part.id) ?? {
      order: ctx.part.order,
      title: ctx.part.title,
      correct: 0,
      total: 0,
    };
    part.correct += q.score;
    part.total += q.maxScore;
    parts.set(ctx.part.id, part);

    const typeKey = breakdownType(ctx.group.questionType);
    const type = types.get(typeKey) ?? { correct: 0, total: 0 };
    type.correct += q.score;
    type.total += q.maxScore;
    types.set(typeKey, type);
  }

  return {
    sectionId,
    skill,
    items,
    counts,
    byPart: [...parts]
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([id, p]) =>
        breakdown(
          `part-${id}`,
          { partTitle: p.title, partOrder: p.order },
          p.correct,
          p.total,
        ),
      ),
    byType: [...types].map(([type, s]) =>
      breakdown(`type-${type}`, type, s.correct, s.total),
    ),
    transcripts,
  };
}

// IELTS rounds the mean of the skill bands to the nearest half band, with quarters rounding up.
export function ieltsBand(bands: number[]): number {
  const mean = bands.reduce((sum, b) => sum + b, 0) / bands.length;
  const whole = Math.floor(mean);
  const fraction = mean - whole;
  if (fraction < 0.25) return whole;
  if (fraction < 0.75) return whole + 0.5;
  return whole + 1;
}

const isToeic = (examType: ExamType) =>
  examType === 'TOEIC_LR' || examType === 'TOEIC_SW';

// The headline score of an attempt: TOEIC's graded total, or an estimated IELTS band.
export function overallScore(attempt: AttemptListItem): number | null {
  if (isToeic(attempt.test.examType)) return attempt.overallScore;
  // Practice sessions are not a whole exam, so they get no overall band.
  if (attempt.mode !== 'FULL') return null;
  const bands = attempt.sections
    .filter((s) => s.skill === 'LISTENING' || s.skill === 'READING')
    .map((s) => s.scaledScore);
  // An estimate needs both objective skills; a single section already shows its own band.
  if (bands.length < 2 || bands.some((b) => b === null)) return null;
  return ieltsBand(bands as number[]);
}

function totalScore(
  attempt: AttemptListItem,
  skills: SkillScore[],
): TotalScore | null {
  const score = overallScore(attempt);
  if (score === null) return null;
  return isToeic(attempt.test.examType)
    ? { kind: 'toeic', score, max: 990, parts: skills }
    : { kind: 'ielts', band: score, max: 9 };
}

export function buildResultView(
  result: AttemptResult,
  test: StudentTestDetail,
): ResultView {
  const { attempt, questions } = result;
  const index = indexQuestions(test);
  const transcripts = new Map(
    result.transcripts.map((t) => [t.mediaId, t.transcript]),
  );
  const sections = byOrder(attempt.sections);

  const bySection = new Map<number, AttemptResultQuestion[]>();
  for (const q of questions) {
    bySection.set(q.sectionId, [...(bySection.get(q.sectionId) ?? []), q]);
  }

  const skills: SkillScore[] = sections.map((s) => {
    const own = bySection.get(s.sectionId) ?? [];
    return {
      sectionId: s.sectionId,
      skill: s.skill,
      scaledScore: s.scaledScore,
      rawScore: s.rawScore,
      maxScore: s.maxScore,
      pending: own.length > 0 && own.every(isSample),
    };
  });

  return {
    examType: attempt.test.examType,
    skills,
    total: totalScore(attempt, skills),
    sections: sections.map((s) =>
      sectionResult(
        s.sectionId,
        s.skill,
        bySection.get(s.sectionId) ?? [],
        index,
        sectionTranscripts(
          test.testSections.find((ts) => ts.id === s.sectionId),
          transcripts,
        ),
      ),
    ),
  };
}
