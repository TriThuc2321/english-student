import type { Answer } from '@/lib/exam/structure';
import type { AttemptResult } from '@/types/attempt';
import type {
  SkillType,
  StudentTestDetail,
  StudentTestPart,
} from '@/types/student-test';

import { answerFromResponse } from '@/lib/exam/attempt-sync';
import { questionSlots } from '@/lib/exam/structure';

import type {
  NumberStatus,
  ResultView,
  ReviewItem,
  SectionAssessment,
  SectionTranscript,
  StatusCounts,
} from './view';

export type ReviewSection = {
  sectionId: number;
  skill: SkillType;
  counts: StatusCounts;
  scaledScore: number | null;
  assessment: SectionAssessment | null;
  transcripts: SectionTranscript[];
};

// Plain records rather than Maps: the model crosses from the server page to a client component.
export type ReviewModel = {
  attemptId: string;
  // Only the sections the attempt covered, in attempt order.
  test: StudentTestDetail;
  // Keyed by question id, like the exam state.
  answers: Record<number, Answer>;
  items: Record<number, ReviewItem[]>;
  sections: ReviewSection[];
};

export type ReviewSlot = {
  sectionId: number;
  partId: number;
  questionId: number;
  n: number;
  status: NumberStatus;
};

export function buildReviewModel(
  result: AttemptResult,
  test: StudentTestDetail,
  view: ResultView,
): ReviewModel {
  const answers: Record<number, Answer> = {};
  for (const q of result.questions) {
    const value = answerFromResponse(q.response);
    if (value !== null) answers[q.questionId] = value;
  }

  const items: Record<number, ReviewItem[]> = {};
  for (const section of view.sections) {
    for (const item of section.items) {
      (items[item.questionId] ??= []).push(item);
    }
  }

  const scoreOf = new Map(view.skills.map((s) => [s.sectionId, s.scaledScore]));
  const order = view.sections.map((s) => s.sectionId);

  return {
    attemptId: result.attempt.id,
    test: {
      ...test,
      testSections: test.testSections
        .filter((s) => order.includes(s.id))
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        .map((s, i) => ({ ...s, order: i + 1 })),
    },
    answers,
    items,
    sections: view.sections.map((s) => ({
      sectionId: s.sectionId,
      skill: s.skill,
      counts: s.counts,
      scaledScore: scoreOf.get(s.sectionId) ?? null,
      assessment: s.assessment,
      transcripts: s.transcripts,
    })),
  };
}

// Every question number in exam order, with its review status.
export function reviewSlots(model: ReviewModel): ReviewSlot[] {
  return model.test.testSections.flatMap((section) =>
    questionSlots(section).map((slot) => ({
      sectionId: section.id,
      partId: slot.partId,
      questionId: slot.questionId,
      n: slot.n,
      status:
        model.items[slot.questionId]?.find((item) => item.n === slot.n)
          ?.status ?? 'blank',
    })),
  );
}

export function partTranscripts(
  part: StudentTestPart,
  transcripts: SectionTranscript[],
): SectionTranscript[] {
  const media = new Set(
    [
      part.audio,
      ...part.questionGroups.flatMap((g) => [
        g.audio,
        ...g.questions.map((q) => q.audio),
      ]),
    ]
      .filter((m) => m != null)
      .map((m) => m.id),
  );
  return transcripts.filter((tr) => media.has(tr.mediaId));
}

// A section-wide entry (no part) is shown with the section's first part.
export function partAssessment(
  assessment: SectionAssessment | null,
  partId: number,
  isFirstPart: boolean,
): SectionAssessment | null {
  if (!assessment) return null;
  const entries = assessment.entries.filter(
    (e) => e.partId === partId || (e.partId === null && isFirstPart),
  );
  return entries.length > 0 ? { ...assessment, entries } : null;
}

const parseId = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return raw && Number.isInteger(id) ? id : null;
};

export type ReviewPosition = {
  sectionId: number;
  partId: number | null;
  questionId: number | null;
};

// Where the review opens: the requested question, else the requested section, else the start.
export function initialPosition(
  model: ReviewModel,
  params: { section?: string | string[]; q?: string | string[] },
): ReviewPosition | null {
  const sections = model.test.testSections;
  const questionId = parseId(params.q);
  if (questionId !== null) {
    for (const section of sections) {
      const slot = questionSlots(section).find(
        (s) => s.questionId === questionId,
      );
      if (slot) {
        return { sectionId: section.id, partId: slot.partId, questionId };
      }
    }
  }
  const sectionId = parseId(params.section);
  const section = sections.find((s) => s.id === sectionId) ?? sections[0];
  if (!section) return null;
  const first = [...section.testParts].sort((a, b) => a.order - b.order)[0];
  return { sectionId: section.id, partId: first?.id ?? null, questionId: null };
}
