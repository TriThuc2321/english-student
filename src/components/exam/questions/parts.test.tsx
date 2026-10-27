import type { ReactNode } from 'react';

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { GroupViewModel } from '@/lib/exam/group-view';
import type { Answer } from '@/lib/exam/structure';

import { renderWithIntl } from '@/test/render';

import { ExamGroupContext } from './context';
import { ExamAudio } from './media';
import { Blank, Choices, fillTemplate, KeySelect, QRow } from './parts';

const group = { id: 1 } as GroupViewModel;

function setup(
  ui: ReactNode,
  overrides: { readOnly?: boolean; answers?: Record<number, Answer> } = {},
) {
  const setAnswer = vi.fn();
  const toggleFlag = vi.fn();
  renderWithIntl(
    <ExamGroupContext.Provider
      value={{
        group,
        answers: overrides.answers ?? {},
        setAnswer,
        readOnly: overrides.readOnly ?? false,
        flagged: [],
        toggleFlag,
      }}
    >
      {ui}
    </ExamGroupContext.Provider>,
  );
  return { setAnswer, toggleFlag };
}

describe('question parts', () => {
  it('Blank reports typed text', async () => {
    const { setAnswer } = setup(<Blank n={1} />);
    await userEvent.type(screen.getByLabelText('Answer 1'), 'S');
    expect(setAnswer).toHaveBeenCalledWith(1, 'S');
  });

  it('Blank is disabled when read-only', () => {
    setup(<Blank n={1} />, { readOnly: true });
    expect(screen.getByLabelText('Answer 1')).toBeDisabled();
  });

  it('Choices multi stops at the limit', () => {
    setup(
      <Choices
        n={1}
        multi
        limit={2}
        options={[{ key: 'A' }, { key: 'B' }, { key: 'C' }]}
      />,
      { answers: { 1: ['A', 'B'] } },
    );
    expect(screen.getByDisplayValue('C')).toBeDisabled();
    expect(screen.getByDisplayValue('A')).toBeEnabled();
  });

  it('KeySelect disables listed keys', () => {
    setup(
      <KeySelect
        n={1}
        options={[{ key: 'i' }, { key: 'ii' }]}
        disabledKeys={['i']}
      />,
    );
    expect(screen.getByRole('option', { name: 'i' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'ii' })).toBeEnabled();
  });

  it('QRow exposes an anchor id and toggles the flag', () => {
    const { toggleFlag } = setup(<QRow n={7}>body</QRow>);
    expect(document.getElementById('q-7')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /flag/i }));
    expect(toggleFlag).toHaveBeenCalledWith(7);
  });

  it('fillTemplate replaces tolerant placeholders', () => {
    const { container } = renderWithIntl(
      <p>{fillTemplate('a {{ 3 }} b', (n) => `[${n}]`)}</p>,
    );
    expect(container.textContent).toBe('a [3] b');
  });
});

describe('ExamAudio', () => {
  it('renders a play button', () => {
    renderWithIntl(
      <ExamAudio
        media={{
          id: 1,
          kind: 'AUDIO',
          mimeType: 'audio/mpeg',
          durationMs: 60000,
          url: '/a.mp3',
        }}
        startMs={5000}
        endMs={20000}
      />,
    );
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });
});
