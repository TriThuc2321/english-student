import { test as base } from '@playwright/test';

export type Scenario =
  | 'e2e'
  | 'e2e-row-error'
  | 'e2e-row-error-empty'
  | 'e2e-empty'
  | 'e2e-no-profile'
  | 'e2e-error'
  | 'e2e-expired';

type Fixtures = {
  signIn: (scenario?: Scenario) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  signIn: async ({ context }, use) => {
    // The mock API picks the scenario from the bearer token, i.e. the access cookie value.
    await use(async (scenario = 'e2e') => {
      await context.addCookies([
        {
          name: 'st_access_token',
          value: scenario,
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'st_refresh_token',
          value: 'e2e-refresh',
          domain: 'localhost',
          path: '/',
        },
      ]);
    });
  },
});

export { expect } from '@playwright/test';
