import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StudentQuestionGroup } from '@/types/student-test';

import { buildReviewModel } from '@/lib/results/review';
import { buildResultView } from '@/lib/results/view';
import { makeAttemptResult } from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { GroupView } from './groupView';

const test = makeTest();
const result = makeAttemptResult();
const model = buildReviewModel(result, test, buildResultView(result, test));

const group = (id: number) => {
  const found = test.testSections
    .flatMap((s) => s.testParts)
    .flatMap((p) => p.questionGroups)
    .find((g) => g.id === id);
  if (!found) throw new Error(`no group ${id}`);
  return found;
};

const renderReview = (g: StudentQuestionGroup) =>
  renderWithIntl(
    <GroupView
      group={g}
      answers={model.answers}
      setAnswer={vi.fn()}
      readOnly
      flagged={[]}
      toggleFlag={vi.fn()}
      review={model.items}
    />,
  );

describe('question views in review', () => {
  it('marks the right option and the wrong pick, without flags', () => {
    // Question 3–4: picked A and C, the answer is A and D.
    renderReview(group(3001));

    const row = within(document.getElementById('q-3')!);
    expect(row.getByText(/1\/2 correct/)).toBeVisible();
    expect(row.getByText('Correct answer:')).toBeVisible();
    expect(
      row.getByText('A · A swimming pool, D · A gym', { exact: false }),
    ).toBeVisible();
    expect(row.getAllByText('Your choice')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /flag/i })).toBeNull();
  });

  it('opens the explanation of a correct answer only on demand', () => {
    renderReview(group(3010));

    const trigger = screen.getByRole('button', { name: 'Explanation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the explanation of a missed answer and shows its evidence', () => {
    const missed = makeAttemptResult({
      questions: [
        ...result.questions.filter((q) => q.questionId !== 11),
        {
          ...result.questions.find((q) => q.questionId === 11)!,
          explanation: 'Paragraph B is about trade routes.',
          evidence: { paragraphId: 2, quote: 'spread to Europe' },
        },
      ],
    });
    const items = buildReviewModel(
      missed,
      test,
      buildResultView(missed, test),
    ).items;
    renderWithIntl(
      <GroupView
        group={group(3100)}
        answers={model.answers}
        setAnswer={vi.fn()}
        readOnly
        flagged={[]}
        toggleFlag={vi.fn()}
        review={items}
      />,
    );

    const row = within(document.getElementById('q-11')!);
    expect(row.getByRole('button', { name: 'Explanation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(row.getByText('Paragraph B is about trade routes.')).toBeVisible();
    expect(row.getByText('“spread to Europe”')).toBeVisible();
  });

  it('lists inline blanks with their answers under the group', () => {
    // Question 2 was left blank; its accepted answer shows next to the box and in the list.
    renderReview(group(3000));

    expect(screen.getByText('1/2 correct')).toBeVisible();
    const list = within(
      screen.getByRole('list', { name: 'Answers and explanations' }),
    );
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText(/Blank/)).toBeVisible();
    expect(screen.getAllByText('CB2 1TN')).toHaveLength(2);
    expect(screen.getByLabelText('Answer 1')).toHaveValue('Smith');
  });
});
