import { expect, test } from './fixtures';

// Seeded by e2e/mock-api/server.ts.
const GRADED_ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';

test.beforeEach(async ({ signIn }) => {
  await signIn();
});

test('lists attempts with their scores and actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'My attempts' }).first().click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'My attempts' }),
  ).toBeVisible();

  const table = page.getByRole('grid', { name: 'All attempts' });
  const open = table.getByRole('row', { name: /Academic Test 13/ });
  await expect(open.getByText('In progress')).toBeVisible();
  await expect(open.getByRole('link', { name: 'Resume' })).toHaveAttribute(
    'href',
    '/tests/academic-test-13-13/take',
  );

  const practice = table
    .getByRole('row', { name: /Academic Test 14/ })
    .filter({ hasText: 'Sections' });
  await expect(practice.getByText(/^L \d\.\d · R \d\.\d$/)).toBeVisible();
  await practice.getByRole('link', { name: 'View results' }).click();

  await expect(page).toHaveURL(`/attempts/${GRADED_ATTEMPT_ID}/result`);
});
