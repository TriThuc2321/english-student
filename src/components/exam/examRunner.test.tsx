import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamDraft } from '@/lib/exam/draft';
import type { Attempt } from '@/types/attempt';

import { LOCALE } from '@/i18n';
import {
  getAttempt,
  openAttempt,
  saveAttemptAnswers,
  submitAttempt,
  submitAttemptSection,
  uploadAttemptAudio,
} from '@/lib/api/attempts-client';
import { ApiError } from '@/lib/api/client';
import {
  ATTEMPT_ID,
  attemptSection,
  makeAttempt,
} from '@/test/fixtures/attempt';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import en from '../../../messages/en.json';
import { ExamRunner } from './examRunner';

const test = makeTest();

const push = vi.fn();
const replace = vi.fn();
const router = { push, replace };
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/lib/api/attempts-client', () => ({
  openAttempt: vi.fn(),
  getAttempt: vi.fn(),
  saveAttemptAnswers: vi.fn(),
  submitAttempt: vi.fn(),
  submitAttemptSection: vi.fn(),
  uploadAttemptAudio: vi.fn(),
}));
vi.mock('./useRecorder', async () => {
  const { useState } = await import('react');
  return {
    useRecorder: () => {
      const [state, setState] = useState<'idle' | 'recording'>('idle');
      return {
        state,
        error: null,
        elapsedMs: 0,
        start: async () => {
          setState('recording');
          return true;
        },
        stop: async () => {
          setState('idle');
          return new Blob(['voice'], { type: 'audio/webm' });
        },
      };
    },
  };
});

const SERVER_NOW = '2026-10-27T19:00:00.000Z';
const secondsFromNow = (s: number) =>
  new Date(Date.parse(SERVER_NOW) + s * 1000).toISOString();

const listeningOpen = (seconds = 1800) =>
  attemptSection(30, {
    status: 'IN_PROGRESS',
    submittedAt: null,
    deadlineAt: secondsFromNow(seconds),
  });
const readingWaiting = attemptSection(31, {
  skill: 'READING',
  order: 2,
  status: 'NOT_STARTED',
  startedAt: null,
  submittedAt: null,
});
const readingOpen = attemptSection(31, {
  skill: 'READING',
  order: 2,
  status: 'IN_PROGRESS',
  submittedAt: null,
});
const listeningDone = attemptSection(30, { status: 'SUBMITTED' });

const currentStep = () =>
  screen
    .getByRole('list', { name: 'Sections' })
    .querySelector('[aria-current="step"]');

function saveDraft(overrides: Partial<ExamDraft>) {
  localStorage.setItem(
    'exam-draft:practice-test-1',
    JSON.stringify({
      version: 2,
      answers: {},
      sectionId: 30,
      partId: 300,
      remaining: { 30: 1800, 31: 1800 },
      flagged: {},
      ...overrides,
    }),
  );
}

function serve(overrides: Partial<Attempt> = {}) {
  vi.mocked(openAttempt).mockResolvedValue(
    makeAttempt({
      serverNow: SERVER_NOW,
      sections: [listeningOpen(), readingWaiting],
      ...overrides,
    }),
  );
}

async function renderRunner(ui = <ExamRunner test={test} />) {
  const view = renderWithIntl(ui);
  await waitFor(() =>
    expect(screen.queryByTestId('exam-loading')).not.toBeInTheDocument(),
  );
  return view;
}

async function confirmSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Submit section' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(
    within(dialog).getByRole('button', { name: 'Submit section' }),
  );
  return dialog;
}

describe('ExamRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    vi.clearAllMocks();
    serve();
    vi.mocked(saveAttemptAnswers).mockResolvedValue({
      savedAt: SERVER_NOW,
      serverNow: SERVER_NOW,
    });
  });
  afterEach(() => vi.useRealTimers());

  it('server-renders a skeleton, then shows the first part once the attempt opens', async () => {
    const html = renderToString(
      <NextIntlClientProvider locale={LOCALE.EN} messages={en} timeZone="UTC">
        <ExamRunner test={test} />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('data-testid="exam-loading"');
    expect(html).not.toContain('Answer 1');

    await renderRunner();
    expect(screen.getByLabelText('Answer 1')).toBeInTheDocument();
    expect(openAttempt).toHaveBeenCalledWith({ testId: 1, mode: 'FULL' });
  });

  it('starts a practice attempt for the chosen sections', async () => {
    serve({ mode: 'SECTION', sections: [listeningOpen()] });
    await renderRunner(<ExamRunner test={test} sectionIds={[30]} />);

    expect(openAttempt).toHaveBeenCalledWith({
      testId: 1,
      mode: 'SECTION',
      sectionIds: [30],
    });
  });

  it('restores answers and flags saved on the server', async () => {
    serve({
      answers: [
        {
          questionId: 1,
          response: { text: 'Smith' },
          flagged: true,
          answeredAt: null,
        },
      ],
    });
    await renderRunner();

    expect(screen.getByLabelText('Answer 1')).toHaveValue('Smith');
    expect(
      screen.getByRole('button', { name: /^Question 1, answered, flagged/ }),
    ).toBeInTheDocument();
  });

  it('restores the saved part from the local draft', async () => {
    serve({ sections: [listeningDone, readingOpen] });
    saveDraft({ sectionId: 31, partId: 311 });
    await renderRunner();

    expect(currentStep()).toHaveTextContent('Reading');
    expect(
      screen.getByRole('heading', { name: 'Passage 2' }),
    ).toBeInTheDocument();
  });

  it('ignores a practice draft when starting the full test', async () => {
    saveDraft({ sectionId: 31, partId: 310, sectionIds: [30] });
    await renderRunner();

    expect(currentStep()).toHaveTextContent('Listening');
    expect(screen.getByLabelText('Answer 1')).toBeEnabled();
  });

  it('follows an open attempt that covers other sections', async () => {
    serve({ mode: 'SECTION', sections: [{ ...readingOpen, order: 1 }] });
    renderWithIntl(<ExamRunner test={test} />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        '/tests/practice-test-1/take?sections=31',
      ),
    );
  });

  it('shows the result of an attempt that is already closed', async () => {
    serve({ status: 'GRADED' });
    renderWithIntl(<ExamRunner test={test} />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}/result`),
    );
  });

  it('offers a retry when the attempt cannot be opened', async () => {
    vi.mocked(openAttempt).mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<ExamRunner test={test} />);

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByLabelText('Answer 1')).toBeInTheDocument();
    expect(openAttempt).toHaveBeenCalledTimes(2);
  });

  it('saves changed answers to the attempt', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();

    await user.type(screen.getByLabelText('Answer 1'), 'Smith');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    expect(saveAttemptAnswers).toHaveBeenLastCalledWith(
      ATTEMPT_ID,
      [{ questionId: 1, response: { text: 'Smith' }, flagged: false }],
      { keepalive: false },
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('keeps Next within the current section', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(
      screen.getByRole('button', { name: 'Next question' }),
    ).toBeDisabled();
    expect(currentStep()).toHaveTextContent('Listening');
  });

  it('submits the section after confirming and moves to the next one', async () => {
    vi.mocked(submitAttemptSection).mockResolvedValue(
      makeAttempt({ sections: [listeningDone, readingOpen] }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();

    const dialog = await confirmSubmit(user);
    expect(
      within(dialog).getByText('Submit the Listening section?'),
    ).toBeInTheDocument();

    await waitFor(() => expect(currentStep()).toHaveTextContent('Reading'));
    expect(submitAttemptSection).toHaveBeenCalledWith(ATTEMPT_ID, 30);
    expect(screen.getAllByText('The history of tea').length).toBeGreaterThan(0);
  });

  it('opens the result after submitting the last section', async () => {
    serve({ sections: [listeningDone, readingOpen] });
    vi.mocked(submitAttempt).mockResolvedValue(
      makeAttempt({ status: 'GRADED' }),
    );
    saveDraft({ sectionId: 31, partId: 310 });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();

    await confirmSubmit(user);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}/result`),
    );
    expect(submitAttempt).toHaveBeenCalledWith(ATTEMPT_ID);
    expect(localStorage.getItem('exam-draft:practice-test-1')).toBeNull();
  });

  it('keeps the dialog open with an error when submitting fails', async () => {
    vi.mocked(submitAttemptSection).mockRejectedValue(new Error('offline'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();

    const dialog = await confirmSubmit(user);

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      "We couldn't submit this section.",
    );
    expect(dialog).toBeInTheDocument();
  });

  it('opens the time-up dialog and locks inputs when the section runs out', async () => {
    serve({ sections: [listeningOpen(3), readingWaiting] });
    await renderRunner();
    expect(screen.getByLabelText('Answer 1')).toBeEnabled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Time is up')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer 1')).toBeDisabled();
  });

  it('moves to the next section from the time-up dialog', async () => {
    serve({ sections: [listeningOpen(1), readingWaiting] });
    // The server already expired the section, so submitting it conflicts.
    vi.mocked(submitAttemptSection).mockRejectedValue(
      new ApiError(409, { code: 'SECTION_NOT_OPEN' }),
    );
    vi.mocked(getAttempt).mockResolvedValue(
      makeAttempt({
        sections: [attemptSection(30, { status: 'EXPIRED' }), readingOpen],
      }),
    );
    await renderRunner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(
      screen.getByRole('button', { name: 'Continue to Reading' }),
    );
    await waitFor(() => expect(currentStep()).toHaveTextContent('Reading'));
    expect(getAttempt).toHaveBeenCalledWith(ATTEMPT_ID);
  });

  it('continues automatically after the time-up countdown', async () => {
    serve({ sections: [listeningOpen(1), readingWaiting] });
    vi.mocked(submitAttemptSection).mockResolvedValue(
      makeAttempt({ sections: [listeningDone, readingOpen] }),
    );
    await renderRunner();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Time is up')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(currentStep()).toHaveTextContent('Reading');
    expect(submitAttemptSection).toHaveBeenCalledTimes(1);
  });

  it('skips a section that the server already closed', async () => {
    serve({
      sections: [attemptSection(30, { status: 'EXPIRED' }), readingOpen],
    });
    await renderRunner();
    expect(currentStep()).toHaveTextContent('Reading');
    expect(screen.queryByText('Time is up')).not.toBeInTheDocument();
  });

  it('does not refocus a previously selected question after stepping parts', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    serve({ sections: [listeningDone, readingOpen] });
    saveDraft({ sectionId: 31, partId: 310 });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner();
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
    const { container } = await renderRunner(<ExamRunner test={withAudio} />);
    const first = container.querySelector('audio');
    expect(first).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    const second = container.querySelector('audio');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});

// A test with a single section holding one IELTS Writing or Speaking question.
function productiveTest(
  skill: 'WRITING' | 'SPEAKING',
): ReturnType<typeof makeTest> {
  const [listening] = test.testSections;
  const [part] = listening.testParts;
  const [group] = part.questionGroups;
  return makeTest({
    testSections: [
      {
        ...listening,
        id: 40,
        skill,
        testParts: [
          {
            ...part,
            id: 400,
            audio: null,
            questionGroups: [
              {
                ...group,
                id: 4000,
                questionType:
                  skill === 'WRITING'
                    ? 'IELTS_WRITING_TASK_2'
                    : 'IELTS_SPEAKING_PART_1',
                questions: [
                  {
                    ...group.questions[0],
                    id: 77,
                    numberFrom: 1,
                    numberTo: 1,
                    prompt: 'Describe your hometown.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
}

describe('ExamRunner with Writing and Speaking', () => {
  const productiveSection = (skill: 'WRITING' | 'SPEAKING') =>
    attemptSection(40, {
      skill,
      status: 'IN_PROGRESS',
      submittedAt: null,
      deadlineAt: secondsFromNow(900),
    });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem(`mic-check:${ATTEMPT_ID}`, '1');
    vi.clearAllMocks();
    vi.mocked(saveAttemptAnswers).mockResolvedValue({
      savedAt: SERVER_NOW,
      serverNow: SERVER_NOW,
    });
    vi.mocked(submitAttempt).mockResolvedValue(
      makeAttempt({ status: 'SUBMITTED' }),
    );
  });
  afterEach(() => vi.useRealTimers());

  it('autosaves an essay in a Writing section', async () => {
    serve({ sections: [productiveSection('WRITING')] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner(<ExamRunner test={productiveTest('WRITING')} />);

    await user.type(screen.getByLabelText('Answer 1'), 'My town is small.');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    expect(saveAttemptAnswers).toHaveBeenLastCalledWith(
      ATTEMPT_ID,
      [
        {
          questionId: 77,
          response: { text: 'My town is small.' },
          flagged: false,
        },
      ],
      { keepalive: false },
    );
  });

  it('asks for a microphone check once on entering a Speaking section', async () => {
    sessionStorage.clear();
    serve({ sections: [productiveSection('SPEAKING')] });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = await renderRunner(
      <ExamRunner test={productiveTest('SPEAKING')} />,
    );

    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Check your microphone' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Microphone works — start' }),
    ).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Skip' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(sessionStorage.getItem(`mic-check:${ATTEMPT_ID}`)).toBe('1');

    unmount();
    await renderRunner(<ExamRunner test={productiveTest('SPEAKING')} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('skips the microphone check outside Speaking', async () => {
    sessionStorage.clear();
    serve({ sections: [productiveSection('WRITING')] });
    await renderRunner(<ExamRunner test={productiveTest('WRITING')} />);

    expect(screen.getByLabelText('Answer 1')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('waits for an in-flight recording before submitting', async () => {
    serve({ sections: [productiveSection('SPEAKING')] });
    let finish: (mediaId: number) => void = () => {};
    vi.mocked(uploadAttemptAudio).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner(<ExamRunner test={productiveTest('SPEAKING')} />);

    await user.click(screen.getByRole('button', { name: 'Start recording' }));
    await user.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(uploadAttemptAudio).toHaveBeenCalledWith(
      ATTEMPT_ID,
      77,
      expect.any(Blob),
    );

    await confirmSubmit(user);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitAttempt).not.toHaveBeenCalled();

    await act(async () => finish(42));
    await waitFor(() => expect(submitAttempt).toHaveBeenCalledWith(ATTEMPT_ID));
    expect(saveAttemptAnswers).not.toHaveBeenCalled();
  });

  it('uploads a recording still running when time runs out', async () => {
    serve({
      sections: [
        attemptSection(40, {
          skill: 'SPEAKING',
          status: 'IN_PROGRESS',
          submittedAt: null,
          deadlineAt: secondsFromNow(5),
        }),
      ],
    });
    vi.mocked(uploadAttemptAudio).mockResolvedValue(42);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner(<ExamRunner test={productiveTest('SPEAKING')} />);

    await user.click(screen.getByRole('button', { name: 'Start recording' }));
    await screen.findByRole('button', { name: 'Stop' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(screen.getByText('Time is up')).toBeInTheDocument();
    await waitFor(() =>
      expect(uploadAttemptAudio).toHaveBeenCalledWith(
        ATTEMPT_ID,
        77,
        expect.any(Blob),
      ),
    );
  });

  it('uploads a recording still running before submitting', async () => {
    serve({ sections: [productiveSection('SPEAKING')] });
    vi.mocked(uploadAttemptAudio).mockResolvedValue(42);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner(<ExamRunner test={productiveTest('SPEAKING')} />);

    await user.click(screen.getByRole('button', { name: 'Start recording' }));
    await screen.findByRole('button', { name: 'Stop' });
    await confirmSubmit(user);

    await waitFor(() => expect(submitAttempt).toHaveBeenCalledWith(ATTEMPT_ID));
    expect(
      vi.mocked(uploadAttemptAudio).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(submitAttempt).mock.invocationCallOrder[0]);
  });

  it('submits even if the recording failed', async () => {
    serve({ sections: [productiveSection('SPEAKING')] });
    let fail: (error: Error) => void = () => {};
    vi.mocked(uploadAttemptAudio).mockReturnValue(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderRunner(<ExamRunner test={productiveTest('SPEAKING')} />);

    await user.click(screen.getByRole('button', { name: 'Start recording' }));
    await user.click(await screen.findByRole('button', { name: 'Stop' }));
    await confirmSubmit(user);
    await act(async () => fail(new Error('offline')));

    await waitFor(() => expect(submitAttempt).toHaveBeenCalledWith(ATTEMPT_ID));
  });
});
