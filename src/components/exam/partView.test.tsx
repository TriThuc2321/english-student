import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeTest } from '@/test/fixtures/student-test';
import { renderWithIntl } from '@/test/render';

import { PartView } from './partView';

const parts = makeTest().testSections[1].testParts;

const props = {
  index: 0,
  answers: {},
  onAnswer: vi.fn(),
  readOnly: false,
  flagged: [],
  onToggleFlag: vi.fn(),
};

describe('PartView', () => {
  it('shows the part passage with paragraph labels beside the questions', () => {
    renderWithIntl(<PartView part={parts[0]} {...props} />);
    expect(screen.getAllByText('The history of tea').length).toBeGreaterThan(0);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer 1')).toBeInTheDocument();
  });

  it('shows the empty message for a part without groups', () => {
    renderWithIntl(<PartView part={parts[1]} {...props} />);
    expect(
      screen.getByText('This part has no questions yet.'),
    ).toBeInTheDocument();
  });

  it('shows the empty message when there is no part', () => {
    renderWithIntl(<PartView part={null} {...props} />);
    expect(
      screen.getByText('This part has no questions yet.'),
    ).toBeInTheDocument();
  });
});

describe('PartView focus requests', () => {
  it('scrolls to and focuses the requested question', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(
      <PartView part={parts[0]} {...props} focusRequest={{ n: 1, seq: 1 }} />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Answer 1')).toHaveFocus(),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });
});
