import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Answer } from '@/lib/exam/structure';
import type { StudentQuestionGroup } from '@/types/student-test';

import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { GroupView } from './groupView';

const fixtureGroup = (id: number) => {
  const group = makeTest()
    .testSections.flatMap((s) => s.testParts)
    .flatMap((p) => p.questionGroups)
    .find((g) => g.id === id);
  if (!group) throw new Error(`no group ${id}`);
  return group;
};

const inlineGroup = (
  overrides: Partial<StudentQuestionGroup>,
): StudentQuestionGroup => ({
  ...fixtureGroup(3000),
  ...overrides,
});

function setup(
  group: StudentQuestionGroup,
  { answers = {}, readOnly = false } = {},
) {
  const setAnswer = vi.fn();
  const toggleFlag = vi.fn();
  renderWithIntl(
    <GroupView
      group={group}
      answers={answers}
      setAnswer={setAnswer}
      readOnly={readOnly}
      flagged={[]}
      toggleFlag={toggleFlag}
    />,
  );
  return { setAnswer, toggleFlag };
}

describe('question views', () => {
  it('MCQ reports the chosen option', async () => {
    const { setAnswer } = setup(fixtureGroup(3010));
    await userEvent.click(screen.getByRole('radio', { name: /In the office/ }));
    expect(setAnswer).toHaveBeenCalledWith(5, 'B');
  });

  it('MCQ radios are disabled when read-only', () => {
    setup(fixtureGroup(3010), { readOnly: true });
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });

  it('multi choice collects picks and caps them at the answer count', async () => {
    const group = fixtureGroup(3001);
    const setAnswer = vi.fn();
    const Harness = () => {
      const [answers, setAnswers] = useState<Record<number, Answer>>({});
      return (
        <GroupView
          group={group}
          answers={answers}
          setAnswer={(n, value) => {
            setAnswer(n, value);
            setAnswers((prev) => ({ ...prev, [n]: value }));
          }}
          readOnly={false}
          flagged={[]}
          toggleFlag={vi.fn()}
        />
      );
    };
    renderWithIntl(<Harness />);

    await userEvent.click(screen.getByRole('checkbox', { name: /swimming/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /cafe/ }));
    expect(setAnswer).toHaveBeenLastCalledWith(3, ['A', 'C']);
    expect(screen.getByRole('checkbox', { name: /library/ })).toBeDisabled();
  });

  it('form completion renders a textbox per blank', () => {
    setup(fixtureGroup(3000));
    expect(screen.getByLabelText('Answer 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer 2')).toBeInTheDocument();
  });

  it('renders a textbox for a placeholder without a question', () => {
    setup(inlineGroup({ content: { template: 'Name: {{1}}\nRef: {{9}}' } }));
    expect(screen.getByLabelText('Answer 9')).toBeInTheDocument();
  });

  it('matching disables keys used by another question when reuse is off', () => {
    setup(fixtureGroup(3100), { answers: { 1: 'i' } });
    const second = screen.getByLabelText('Answer 2');
    expect(within(second).getByRole('option', { name: 'i' })).toBeDisabled();
    const first = screen.getByLabelText('Answer 1');
    expect(within(first).getByRole('option', { name: 'i' })).toBeEnabled();
  });

  it('essay shows a live word count', async () => {
    const group = inlineGroup({
      questionType: 'OPINION_ESSAY',
      content: null,
      questions: [{ ...fixtureGroup(3000).questions[0], prompt: 'Discuss.' }],
    });
    const Harness = () => {
      const [answers, setAnswers] = useState<Record<number, Answer>>({});
      return (
        <GroupView
          group={group}
          answers={answers}
          setAnswer={(n, value) =>
            setAnswers((prev) => ({ ...prev, [n]: value }))
          }
          readOnly={false}
          flagged={[]}
          toggleFlag={vi.fn()}
        />
      );
    };
    renderWithIntl(<Harness />);
    await userEvent.type(screen.getByLabelText('Answer 1'), 'one two three');
    expect(screen.getByText(/3 words/)).toBeInTheDocument();
    expect(screen.getByText(/minimum 300/)).toBeInTheDocument();
  });

  it('inline blanks are the q-<n> anchor and carry the flag toggle', async () => {
    const { toggleFlag } = setup(fixtureGroup(3000));
    expect(document.getElementById('q-1')).toBe(
      screen.getByLabelText('Answer 1'),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Flag question 1 for review' }),
    );
    expect(toggleFlag).toHaveBeenCalledWith(1);
  });

  it('speaking questions have an anchor and a flag toggle', () => {
    setup(
      inlineGroup({
        questionType: 'READ_ALOUD',
        content: null,
        questions: [{ ...fixtureGroup(3000).questions[0], prompt: 'Read.' }],
      }),
    );
    expect(document.getElementById('q-1')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Flag question 1 for review' }),
    ).toBeInTheDocument();
  });

  it('shows the recording tooltip from the keyboard', async () => {
    setup(
      inlineGroup({
        questionType: 'READ_ALOUD',
        content: null,
        questions: [{ ...fixtureGroup(3000).questions[0], prompt: 'Read.' }],
      }),
    );
    await userEvent.tab();
    expect(
      await screen.findByText('Voice recording is coming soon.'),
    ).toBeVisible();
  });
});
