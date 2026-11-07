import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Answer } from '@/lib/exam/structure';
import type { StudentQuestionGroup } from '@/types/student-test';

import { uploadAttemptAudio } from '@/lib/api/attempts-client';
import { ApiError } from '@/lib/api/client';
import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { AttemptAudioContext } from '../attemptAudio';
import { useAttemptRecordings } from '../useAttemptRecordings';
import { GroupView } from './groupView';

vi.mock('@/lib/api/attempts-client', () => ({ uploadAttemptAudio: vi.fn() }));

const recorderMock = vi.hoisted(() => ({
  error: null as null | 'permission' | 'unsupported',
  blob: new Blob(['voice'], { type: 'audio/webm' }),
}));

vi.mock('../useRecorder', async () => {
  const { useState } = await import('react');
  return {
    useRecorder: () => {
      const [state, setState] = useState<'idle' | 'recording' | 'error'>(
        'idle',
      );
      return {
        state,
        error: state === 'error' ? recorderMock.error : null,
        elapsedMs: 0,
        start: async () => {
          const ok = recorderMock.error === null;
          setState(ok ? 'recording' : 'error');
          return ok;
        },
        stop: async () => {
          setState('idle');
          return recorderMock.blob;
        },
      };
    },
  };
});

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
    expect(setAnswer).toHaveBeenCalledWith(4, 'B');
  });

  it('saves and reads answers by question id, not number', async () => {
    const group = inlineGroup({
      questionType: 'IELTS_WRITING_TASK_2',
      content: null,
      questions: [{ ...fixtureGroup(3000).questions[0], id: 99 }],
    });
    const { setAnswer, toggleFlag } = setup(group, {
      answers: { 1: 'stale by number', 99: 'saved essay' },
    });

    const box = screen.getByLabelText('Answer 1');
    expect(box).toHaveValue('saved essay');
    await userEvent.type(box, '!');
    expect(setAnswer).toHaveBeenLastCalledWith(99, 'saved essay!');
    await userEvent.click(screen.getByRole('button', { name: /flag/i }));
    expect(toggleFlag).toHaveBeenCalledWith(99);
    expect(document.getElementById('q-99')).not.toBeNull();
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
    setup(fixtureGroup(3100), { answers: { 10: 'i' } });
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

const speakingGroup = () =>
  inlineGroup({
    questionType: 'IELTS_SPEAKING_PART_1',
    content: null,
    questions: [
      {
        ...fixtureGroup(3000).questions[0],
        id: 77,
        prompt: 'Do you work or study?',
      },
    ],
  });

type SpeakingProps = {
  answers?: Record<number, Answer>;
  readOnly?: boolean;
  shown?: boolean;
};

function Speaking({
  onSaved,
  answers = {},
  readOnly = false,
  shown = true,
}: SpeakingProps & { onSaved: (questionId: number, mediaId: number) => void }) {
  const audio = useAttemptRecordings('a1', onSaved);
  return (
    <AttemptAudioContext.Provider value={audio}>
      {shown && (
        <GroupView
          group={speakingGroup()}
          answers={answers}
          setAnswer={vi.fn()}
          readOnly={readOnly}
          flagged={[]}
          toggleFlag={vi.fn()}
        />
      )}
    </AttemptAudioContext.Provider>
  );
}

function setupSpeaking(props: SpeakingProps = {}) {
  const onSaved = vi.fn();
  const view = renderWithIntl(<Speaking onSaved={onSaved} {...props} />);
  return {
    onSaved,
    rerender: (next: SpeakingProps) =>
      view.rerender(<Speaking onSaved={onSaved} {...next} />),
  };
}

const upload = vi.mocked(uploadAttemptAudio);

const record = async () => {
  await userEvent.click(
    screen.getByRole('button', { name: 'Start recording' }),
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Stop' }));
};

describe('IELTS speaking recorder', () => {
  beforeEach(() => {
    recorderMock.error = null;
    upload.mockReset();
    upload.mockResolvedValue(42);
  });

  it('records, uploads and reports the saved recording', async () => {
    const { onSaved } = setupSpeaking();

    await record();

    expect(upload).toHaveBeenCalledWith('a1', 77, recorderMock.blob);
    expect(await screen.findByText('Recording saved')).toBeVisible();
    expect(onSaved).toHaveBeenCalledWith(77, 42);
    expect(screen.getByRole('button', { name: 'Record again' })).toBeVisible();
  });

  it('starts as saved when the question already has a recording', () => {
    setupSpeaking({ answers: { 77: '42' } });
    expect(screen.getByText('Recording saved')).toBeVisible();
  });

  it('shows the closed-section error', async () => {
    upload.mockRejectedValue(new ApiError(409, { code: 'SECTION_NOT_OPEN' }));
    setupSpeaking();

    await record();

    expect(
      await screen.findByText(
        "This section is closed; the recording can't be saved.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('retries a failed upload', async () => {
    upload.mockRejectedValueOnce(new ApiError(500, null));
    setupSpeaking();

    await record();
    expect(
      await screen.findByText("Couldn't save the recording."),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls[1]).toEqual(['a1', 77, recorderMock.blob]);
    expect(await screen.findByText('Recording saved')).toBeVisible();
  });

  it('shows the permission error', async () => {
    recorderMock.error = 'permission';
    setupSpeaking();

    await userEvent.click(
      screen.getByRole('button', { name: 'Start recording' }),
    );

    expect(
      await screen.findByText('Allow microphone access to record.'),
    ).toBeVisible();
  });

  it('cannot record when read-only', () => {
    setupSpeaking({ readOnly: true });
    expect(
      screen.getByRole('button', { name: 'Start recording' }),
    ).toBeDisabled();
  });

  it('keeps the upload state when the question remounts', async () => {
    upload.mockReturnValue(new Promise(() => {}));
    const { rerender } = setupSpeaking();

    await record();
    expect(await screen.findByText('Saving recording…')).toBeVisible();
    rerender({ shown: false });
    rerender({ shown: true });

    expect(screen.getByText('Saving recording…')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Start recording' }),
    ).toBeDisabled();
  });

  it('uploads a recording when the question unmounts mid-recording', async () => {
    const { rerender } = setupSpeaking();

    await userEvent.click(
      screen.getByRole('button', { name: 'Start recording' }),
    );
    await screen.findByRole('button', { name: 'Stop' });
    rerender({ shown: false });

    await vi.waitFor(() =>
      expect(upload).toHaveBeenCalledWith('a1', 77, recorderMock.blob),
    );
  });
});
