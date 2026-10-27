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
  } = {},
) {
  const onSelect = vi.fn();
  renderWithIntl(
    <QuestionNavigator
      section={section}
      partId={overrides.partId ?? 300}
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

const button = (n: number) => screen.getByRole('button', { name: String(n) });

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

  it('marks flagged questions and the current part', () => {
    setup({ flagged: [1] });
    expect(button(1)).toHaveAttribute('data-flagged', 'true');
    expect(button(2)).not.toHaveAttribute('data-flagged');
    expect(button(1)).toHaveAttribute('aria-current', 'true');
    expect(button(5)).not.toHaveAttribute('aria-current');
  });
});
