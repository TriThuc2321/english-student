import type { ExamState } from './reducer';

const VERSION = 1;

// sectionIds is absent for a full-test attempt, which keeps drafts saved before practice mode valid.
export type ExamDraft = ExamState & { sectionIds?: number[] };

function key(slug: string) {
  return `exam-draft:${slug}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadExamDraft(slug: string): ExamDraft | null {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== VERSION) return null;
    const {
      answers,
      sectionId,
      partId,
      remaining,
      flagged,
      sectionIds,
      submitted,
    } = parsed;
    if (
      !isRecord(answers) ||
      !isRecord(remaining) ||
      !isRecord(flagged) ||
      typeof sectionId !== 'number' ||
      (partId !== null && typeof partId !== 'number') ||
      (sectionIds !== undefined &&
        (!Array.isArray(sectionIds) ||
          !sectionIds.every((id) => typeof id === 'number'))) ||
      // Drafts written before section submission existed have no submitted list.
      (submitted !== undefined &&
        (!Array.isArray(submitted) ||
          !submitted.every((id) => typeof id === 'number')))
    ) {
      return null;
    }
    return {
      answers: answers as ExamState['answers'],
      sectionId,
      partId,
      remaining: remaining as ExamState['remaining'],
      flagged: flagged as ExamState['flagged'],
      submitted: (submitted as number[] | undefined) ?? [],
      ...(sectionIds !== undefined && { sectionIds: sectionIds as number[] }),
    };
  } catch {
    return null;
  }
}

export function saveExamDraft(
  slug: string,
  state: ExamState,
  sectionIds?: number[] | null,
): boolean {
  try {
    localStorage.setItem(
      key(slug),
      JSON.stringify({
        version: VERSION,
        ...state,
        ...(sectionIds && { sectionIds }),
      }),
    );
    return true;
  } catch {
    // Quota or disabled storage: losing the draft must not break the exam.
    return false;
  }
}

export function hasExamDraft(slug: string): boolean {
  return loadExamDraft(slug) !== null;
}

export function clearExamDraft(slug: string): void {
  try {
    localStorage.removeItem(key(slug));
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
