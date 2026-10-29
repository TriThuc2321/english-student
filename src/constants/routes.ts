export const ROUTES = {
  HOME: '/',
  TESTS: '/tests',
  test: (slug: string) => `/tests/${slug}`,
  takeTest: (slug: string, sectionIds?: number[] | null) =>
    sectionIds?.length
      ? `/tests/${slug}/take?sections=${sectionIds.join(',')}`
      : `/tests/${slug}/take`,
  ATTEMPTS: '/attempts',
  attempts: (page = 1) => (page > 1 ? `/attempts?page=${page}` : '/attempts'),
  attemptResult: (id: string) => `/attempts/${id}/result`,
};

export const SESSION_EXPIRED_PATH = '/api/session/expired';
