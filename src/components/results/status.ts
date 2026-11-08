import type { NumberStatus } from '@/lib/results/view';

export const CELL_CLASSES: Record<NumberStatus, string> = {
  correct: 'bg-success/15 text-success border border-success/40',
  incorrect: 'bg-danger-soft text-foreground border-2 border-danger',
  blank: 'text-muted border border-dashed border-field-border',
  pending: 'bg-surface-secondary text-muted border border-separator',
  graded: 'bg-brand-navy-soft text-brand-navy border border-brand-navy/40',
};

export const BADGE_CLASSES: Record<NumberStatus, string> = {
  correct: 'bg-success text-success-foreground',
  incorrect: 'bg-danger text-danger-foreground',
  blank: 'bg-surface-secondary text-muted',
  pending: 'bg-surface-secondary text-muted',
  graded: 'bg-brand-navy-soft text-brand-navy',
};

export const GLYPHS: Record<NumberStatus, string> = {
  correct: '✓',
  incorrect: '✗',
  blank: '–',
  pending: '…',
  graded: '✓',
};

export const LEGEND_SWATCHES: Record<NumberStatus, string> = {
  correct: 'bg-success',
  incorrect: 'border-2 border-danger bg-danger-soft',
  blank: 'border border-dashed border-field-border',
  pending: 'border border-separator bg-surface-secondary',
  graded: 'border border-brand-navy/40 bg-brand-navy-soft',
};

// An answer field shown back in review: disabled, but kept at full strength so the tint reads.
export const FIELD_CLASSES: Record<NumberStatus, string> = {
  correct: 'border-success bg-success/10 disabled:opacity-100',
  incorrect: 'border-danger bg-danger-soft disabled:opacity-100',
  blank: 'border-dashed border-danger disabled:opacity-100',
  pending: 'disabled:opacity-100',
  graded: 'disabled:opacity-100',
};

export const isMiss = (status: NumberStatus) =>
  status === 'incorrect' || status === 'blank';
