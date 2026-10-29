import { expect, test } from './fixtures';

// Seeded by e2e/mock-api/server.ts.
const GRADED_ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';
const OPEN_ATTEMPT_ID = '22222222-2222-4222-8222-222222222222';

test.beforeEach(async ({ signIn }) => {
  await signIn();
});

test('shows the score and reviews answers', async ({ page }) => {
  await page.goto(`/attempts/${GRADED_ATTEMPT_ID}/result`);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Academic Test 14' }),
  ).toBeVisible();
  const score = page.getByRole('region', { name: 'Score' });
  await expect(score.getByText('Listening', { exact: true })).toBeVisible();
  await expect(score.getByText('8 / 20 correct')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Your answers · Listening' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Question 2, Incorrect' }).click();
  const review = page.getByRole('complementary');
  await expect(
    review.getByRole('heading', { name: 'Question 2' }),
  ).toBeVisible();
  await expect(review.getByText('B · Option B')).toBeVisible();
  await expect(review.getByText('A · Option A')).toBeVisible();

  await page.getByRole('tab', { name: 'Reading' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your answers · Reading' }),
  ).toBeVisible();
});

test('links back to the test to retake it', async ({ page }) => {
  await page.goto(`/attempts/${GRADED_ATTEMPT_ID}/result`);
  await page.getByRole('link', { name: 'Retake test' }).click();

  await expect(page).toHaveURL(/\/tests\/academic-test-14-14$/);
});

test('sends an attempt still in progress back to the exam', async ({
  page,
}) => {
  await page.goto(`/attempts/${OPEN_ATTEMPT_ID}/result`);

  await expect(page).toHaveURL(/\/tests\/academic-test-13-13\/take$/);
});

test('shows not found for an unknown attempt', async ({ page }) => {
  // loading.tsx streams first, so the 404 shows in the page rather than the status code.
  await page.goto('/attempts/99999999-9999-4999-8999-999999999999/result');

  await expect(page.getByText('This page could not be found.')).toBeVisible();
});
