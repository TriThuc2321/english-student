import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamDraft } from '@/lib/exam/draft';

import { LOCALE } from '@/i18n';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import en from '../../../messages/en.json';
import { ExamRunner } from './examRunner';

const test = makeTest();

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const currentStep = () =>
  screen
    .getByRole('list', { name: 'Sections' })
    .querySelector('[aria-current="step"]');

function saveDraft(overrides: Partial<ExamDraft>) {
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
    push.mockClear();
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

  it('ignores a practice draft when starting the full test', () => {
    saveDraft({
      sectionId: 31,
      partId: 310,
      submitted: [30],
      sectionIds: [30],
    });
    renderWithIntl(<ExamRunner test={test} />);
    expect(currentStep()).toHaveTextContent('Listening');
    expect(screen.getByLabelText('Answer 1')).toBeEnabled();
  });

  it('keeps Next within the current section', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(
      screen.getByRole('button', { name: 'Next question' }),
    ).toBeDisabled();
    expect(currentStep()).toHaveTextContent('Listening');
  });

  it('submits the section after confirming and moves to the next one', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: 'Submit section' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Submit the Listening section?'),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: 'Submit section' }),
    );
    expect(currentStep()).toHaveTextContent('Reading');
    expect(screen.getAllByText('The history of tea').length).toBeGreaterThan(0);
  });

  it('returns to the test overview after submitting the last section', async () => {
    saveDraft({ sectionId: 31, partId: 310, submitted: [30] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: 'Submit section' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Submit section' }),
    );
    expect(push).toHaveBeenCalledWith('/tests/practice-test-1');
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
    await user.click(
      screen.getByRole('button', { name: 'Continue to Reading' }),
    );
    expect(currentStep()).toHaveTextContent('Reading');
  });

  it('continues automatically after the time-up countdown', () => {
    saveDraft({ remaining: { 30: 1, 31: 1800 } });
    renderWithIntl(<ExamRunner test={test} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Time is up')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(currentStep()).toHaveTextContent('Reading');
  });

  it('skips a section that was already out of time in the draft', () => {
    saveDraft({ remaining: { 30: 0, 31: 1800 } });
    renderWithIntl(<ExamRunner test={test} />);
    expect(currentStep()).toHaveTextContent('Reading');
    expect(screen.queryByText('Time is up')).not.toBeInTheDocument();
  });

  it('does not refocus a previously selected question after stepping parts', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    saveDraft({ sectionId: 31, partId: 310 });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);
    await user.click(screen.getByRole('button', { name: /^Question 2,/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('button', { name: 'Previous question' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('remounts the part audio when stepping to another part', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    const second = container.querySelector('audio');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});
