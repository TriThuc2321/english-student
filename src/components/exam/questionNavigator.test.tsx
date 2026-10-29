import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Answer } from '@/lib/exam/structure';

import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { QuestionNavigator } from './questionNavigator';

const section = makeTest().testSections[0];

function setup(
  overrides: {
    answers?: Record<number, Answer>;
    flagged?: number[];
    partId?: number | null;
    activeQuestion?: number | null;
  } = {},
) {
  const onSelect = vi.fn();
  renderWithIntl(
    <QuestionNavigator
      section={section}
      partId={overrides.partId ?? 300}
      activeQuestion={overrides.activeQuestion ?? null}
      answers={overrides.answers ?? {}}
      flagged={overrides.flagged ?? []}
      onSelect={onSelect}
      onStep={vi.fn()}
      canPrev={false}
      canNext
    />,
  );
  return { onSelect };
}

const button = (n: number) =>
  screen.getByRole('button', { name: new RegExp(`^Question ${n},`) });

describe('QuestionNavigator', () => {
  it('treats a multi-answer question as answered only when complete', () => {
    setup({ answers: { 3: ['A'] } });
    expect(button(3)).toHaveAttribute('data-answered', 'false');
    expect(button(4)).toHaveAttribute('data-answered', 'false');
  });

  it('marks every number of a complete multi-answer question', () => {
    setup({ answers: { 3: ['A', 'C'] } });
    expect(button(3)).toHaveAttribute('data-answered', 'true');
    expect(button(4)).toHaveAttribute('data-answered', 'true');
  });

  it('selects the question start and its part', async () => {
    const { onSelect } = setup();
    await userEvent.click(button(4));
    expect(onSelect).toHaveBeenCalledWith(300, 3);
  });

  it('describes answered and flagged state in the accessible name', () => {
    setup({ answers: { 1: 'A' }, flagged: [1] });
    expect(button(1)).toHaveAccessibleName('Question 1, answered, flagged');
    expect(button(1)).toHaveAttribute('data-flagged', 'true');
    expect(button(2)).toHaveAccessibleName('Question 2, not answered');
    expect(button(2)).not.toHaveAttribute('data-flagged');
  });

  it('marks only the active question as current', () => {
    setup({ activeQuestion: 2 });
    expect(button(2)).toHaveAttribute('aria-current', 'true');
    expect(button(1)).not.toHaveAttribute('aria-current');
    expect(
      screen.queryByRole('button', { name: /^Question 5,/ }),
    ).not.toBeInTheDocument();
  });

  it('falls back to the first question of the part as current', () => {
    setup({ activeQuestion: 999 });
    expect(button(1)).toHaveAttribute('aria-current', 'true');
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1);
  });

  it('collapses other parts into a jump to their first question', async () => {
    const { onSelect } = setup({ answers: { 5: 'x' } });
    await userEvent.click(screen.getByRole('button', { name: /Part 2/ }));
    expect(onSelect).toHaveBeenCalledWith(301, 5);
  });

  it('marks a multi-answer question as current on all its numbers', () => {
    setup({ activeQuestion: 3 });
    expect(button(3)).toHaveAttribute('aria-current', 'true');
    expect(button(4)).toHaveAttribute('aria-current', 'true');
  });
});
