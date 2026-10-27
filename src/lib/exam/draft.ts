import type { ExamState } from './reducer';

const VERSION = 1;

function key(slug: string) {
  return `exam-draft:${slug}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadExamDraft(slug: string): ExamState | null {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== VERSION) return null;
    const { answers, sectionId, partId, remaining, flagged } = parsed;
    if (
      !isRecord(answers) ||
      !isRecord(remaining) ||
      !isRecord(flagged) ||
      typeof sectionId !== 'number' ||
      (partId !== null && typeof partId !== 'number')
    ) {
      return null;
    }
    return {
      answers: answers as ExamState['answers'],
      sectionId,
      partId,
      remaining: remaining as ExamState['remaining'],
      flagged: flagged as ExamState['flagged'],
    };
  } catch {
    return null;
  }
}

export function saveExamDraft(slug: string, state: ExamState): void {
  try {
    localStorage.setItem(
      key(slug),
      JSON.stringify({ version: VERSION, ...state }),
    );
  } catch {
    // Quota or disabled storage: losing the draft must not break the exam.
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
