export const ROUTES = {
  HOME: '/',
  TESTS: '/tests',
  test: (slug: string) => `/tests/${slug}`,
};

export const SESSION_EXPIRED_PATH = '/api/session/expired';
