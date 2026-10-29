import { expect, test } from './fixtures';

// Only this spec starts attempts on Academic Test 2, so parallel workers never share one.
const READING_ONLY = '/tests/academic-test-2-2/take?sections=21';

test.beforeEach(async ({ signIn }) => {
  await signIn();
});

test('submits a practice section and opens its result', async ({ page }) => {
  await page.goto(READING_ONLY);

  await page
    .getByRole('radio', { name: /Option A/ })
    .first()
    .check();
  await expect(page.getByText('Saved')).toBeVisible();

  await page.getByRole('button', { name: 'Submit section' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Submit section' })
    .click();

  await expect(page).toHaveURL(/\/attempts\/[^/]+\/result$/);
  await expect(
    page.getByRole('button', { name: 'Question 1, Correct' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Question 2, Blank' }),
  ).toBeVisible();
});
