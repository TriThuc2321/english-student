export const ROUTES = {
  HOME: '/',
  TESTS: '/tests',
  test: (slug: string) => `/tests/${slug}`,
  takeTest: (slug: string, sectionIds?: number[] | null) =>
    sectionIds?.length
      ? `/tests/${slug}/take?sections=${sectionIds.join(',')}`
      : `/tests/${slug}/take`,
};

export const SESSION_EXPIRED_PATH = '/api/session/expired';
