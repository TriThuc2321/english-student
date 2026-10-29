import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { StudentTestListItem } from '@/types/student-test';

import { LOCALE } from '@/i18n';
import { renderWithIntl } from '@/test/render';

import TestCard from './testCard';

const test: StudentTestListItem = {
  id: 12,
  slug: 'practice-test-1',
  examType: 'IELTS_ACADEMIC',
  title: 'Practice Test 1',
  source: 'Cambridge IELTS 18',
  durationMinutes: 160,
  publishedAt: '2026-10-20T08:00:00.000Z',
  testSections: [
    { id: 30, skill: 'LISTENING', order: 1, durationMinutes: 30 },
    { id: 31, skill: 'READING', order: 2, durationMinutes: 60 },
  ],
};

describe('TestCard', () => {
  it('links to the overview', () => {
    renderWithIntl(<TestCard test={test} />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/tests/practice-test-1',
    );
  });

  it('shows exam, title, source, skills with minutes, duration and date', () => {
    renderWithIntl(<TestCard test={test} />);

    for (const text of [
      'IELTS Academic',
      'Practice Test 1',
      'Cambridge IELTS 18',
      '2 h 40 min',
      'Added October 20, 2026',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    const sections = screen.getByRole('list', { name: 'Sections' });
    expect(
      within(sections)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Listening30 min', 'Reading60 min']);
  });

  it('formats whole hours and short durations', () => {
    const { unmount } = renderWithIntl(
      <TestCard test={{ ...test, durationMinutes: 120 }} />,
    );
    expect(screen.getByText('2 h')).toBeInTheDocument();
    unmount();

    renderWithIntl(<TestCard test={{ ...test, durationMinutes: 45 }} />);
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('omits null fields', () => {
    renderWithIntl(
      <TestCard
        test={{
          ...test,
          source: null,
          durationMinutes: null,
          publishedAt: null,
          testSections: [
            { id: 30, skill: 'LISTENING', order: 1, durationMinutes: null },
          ],
        }}
      />,
    );

    expect(screen.queryByText(/Cambridge/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Published/)).not.toBeInTheDocument();
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('translates to Vietnamese', () => {
    renderWithIntl(<TestCard test={test} />, { locale: LOCALE.VI });

    expect(screen.getByText('Nghe')).toBeInTheDocument();
    expect(screen.getByText('2 giờ 40 phút')).toBeInTheDocument();
  });
});
