export const ROUTES = {
  HOME: '/',
  TESTS: '/tests',
  ATTEMPTS: '/attempts',
  test: (slug: string) => `/tests/${slug}`,
  takeTest: (slug: string, sectionIds?: number[] | null) =>
    sectionIds?.length
      ? `/tests/${slug}/take?sections=${sectionIds.join(',')}`
      : `/tests/${slug}/take`,
  attemptResult: (id: string) => `/attempts/${id}/result`,
  attemptReview: (
    id: string,
    at?: { sectionId?: number; questionId?: number },
  ) => {
    const query = new URLSearchParams();
    if (at?.sectionId !== undefined) query.set('section', String(at.sectionId));
    if (at?.questionId !== undefined) query.set('q', String(at.questionId));
    const qs = query.toString();
    return `/attempts/${id}/review${qs ? `?${qs}` : ''}`;
  },
};

export const SESSION_EXPIRED_PATH = '/api/session/expired';
