import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { MicCheckModal } from './micCheckModal';
import { useMicCheck } from './useMicCheck';

vi.mock('./useMicCheck', () => ({ SAMPLE_MS: 5000, useMicCheck: vi.fn() }));

const mic = (overrides: Partial<ReturnType<typeof useMicCheck>> = {}) =>
  vi.mocked(useMicCheck).mockReturnValue({
    state: 'listening',
    error: null,
    level: 0,
    heard: false,
    sampling: false,
    sampleUrl: null,
    start: vi.fn(),
    recordSample: vi.fn(),
    ...overrides,
  });

describe('MicCheckModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for permission first', async () => {
    const start = vi.fn();
    mic({ state: 'idle', start });
    const user = userEvent.setup();
    renderWithIntl(<MicCheckModal isOpen onDone={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Test microphone' }));
    expect(start).toHaveBeenCalled();
  });

  it('lets the student continue once their voice is heard', async () => {
    const onDone = vi.fn();
    mic({ heard: true, level: 0.5 });
    const user = userEvent.setup();
    renderWithIntl(<MicCheckModal isOpen onDone={onDone} />);

    expect(
      screen.getByRole('meter', { name: 'Microphone level' }),
    ).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('We can hear you')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Microphone works — start' }),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it('plays back a recorded sample', () => {
    mic({ sampleUrl: 'blob:sample' });
    renderWithIntl(<MicCheckModal isOpen onDone={() => {}} />);

    expect(screen.getByLabelText('Sample playback')).toHaveAttribute(
      'src',
      'blob:sample',
    );
    expect(
      screen.getByRole('button', { name: 'Microphone works — start' }),
    ).toBeEnabled();
  });

  it('explains a blocked microphone and allows skipping', async () => {
    const onDone = vi.fn();
    mic({ state: 'error', error: 'permission' });
    const user = userEvent.setup();
    renderWithIntl(<MicCheckModal isOpen onDone={onDone} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Microphone access is blocked',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDone).toHaveBeenCalled();
  });
});
