export const ROUTES = {
  HOME: '/',
  TESTS: '/tests',
  test: (slug: string) => `/tests/${slug}`,
  takeTest: (slug: string) => `/tests/${slug}/take`,
};

export const SESSION_EXPIRED_PATH = '/api/session/expired';
