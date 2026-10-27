import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamState } from '@/lib/exam/reducer';

import { LOCALE } from '@/i18n';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import en from '../../../messages/en.json';
import { ExamRunner } from './examRunner';

const test = makeTest();

function saveDraft(overrides: Partial<ExamState>) {
  localStorage.setItem(
    'exam-draft:practice-test-1',
    JSON.stringify({
      version: 1,
      answers: {},
      sectionId: 30,
      partId: 300,
      remaining: { 30: 1800, 31: 1800 },
      flagged: {},
      ...overrides,
    }),
  );
}

describe('ExamRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('server-renders a skeleton, then shows the first part once mounted', () => {
    const html = renderToString(
      <NextIntlClientProvider locale={LOCALE.EN} messages={en} timeZone="UTC">
        <ExamRunner test={test} />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('data-testid="exam-loading"');
    expect(html).not.toContain('Answer 1');

    renderWithIntl(<ExamRunner test={test} />);
    expect(screen.queryByTestId('exam-loading')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Answer 1')).toBeInTheDocument();
  });

  it('restores the saved section and part', () => {
    saveDraft({ sectionId: 31, partId: 310 });
    renderWithIntl(<ExamRunner test={test} />);
    expect(screen.getAllByText('The history of tea').length).toBeGreaterThan(0);
  });

  it('moves to the next section with Next and selects its tab', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByText('The history of tea').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Reading' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('opens the time-up dialog and locks inputs when the section runs out', () => {
    saveDraft({ remaining: { 30: 3, 31: 1800 } });
    renderWithIntl(<ExamRunner test={test} />);
    expect(screen.getByLabelText('Answer 1')).toBeEnabled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Time is up')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer 1')).toBeDisabled();
  });

  it('moves to the next section from the time-up dialog', async () => {
    saveDraft({ remaining: { 30: 1, 31: 1800 } });
    renderWithIntl(<ExamRunner test={test} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'Next section' }));
    expect(screen.getByRole('tab', { name: 'Reading' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('keeps inputs locked without a dialog when the draft is already out of time', () => {
    saveDraft({ remaining: { 30: 0, 31: 1800 } });
    renderWithIntl(<ExamRunner test={test} />);
    expect(screen.getByLabelText('Answer 1')).toBeDisabled();
    expect(screen.queryByText('Time is up')).not.toBeInTheDocument();
  });

  it('does not refocus a previously selected question after stepping parts', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    saveDraft({ sectionId: 31, partId: 310 });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('remounts the part banner audio when stepping to another part', async () => {
    const shared = test.testSections[0].testParts[0];
    const withAudio = {
      ...test,
      testSections: test.testSections.map((section, i) =>
        i === 0
          ? {
              ...section,
              testParts: section.testParts.map((p, j) =>
                j === 1 ? { ...p, audio: shared.audio, audioStartMs: 1000 } : p,
              ),
            }
          : section,
      ),
    };
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderWithIntl(<ExamRunner test={withAudio} />);
    const first = container.querySelector('audio');
    expect(first).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const second = container.querySelector('audio');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});
