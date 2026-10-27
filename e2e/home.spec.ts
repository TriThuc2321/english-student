import { expect, test } from './fixtures';

test('greets the user', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Hi Linh' }),
  ).toBeVisible();
});

test('shows one row per non-empty exam type in order', async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto('/');

  await expect(
    page
      .getByRole('main')
      .getByRole('region')
      .getByRole('heading', { level: 2 }),
  ).toHaveText([
    'IELTS Academic',
    'TOEIC Listening & Reading',
    'TOEIC Speaking & Writing',
  ]);
});

test('shows at most 4 newest tests per row', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');

  const cards = page
    .getByRole('region', { name: 'IELTS Academic' })
    .getByRole('list')
    .getByRole('link');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Academic Test 14');
});

test('shortcut and see-all go to the filtered catalogue', async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto('/');

  await expect(
    page.getByRole('link', { name: 'TOEIC Speaking & Writing', exact: true }),
  ).toHaveAttribute('href', '/tests?exam=TOEIC_SW');
  await expect(
    page
      .getByRole('region', { name: 'TOEIC Listening & Reading' })
      .getByRole('link', { name: 'See all →' }),
  ).toHaveAttribute('href', '/tests?exam=TOEIC_LR');
});

test('opens a test from a card', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');
  await page.getByRole('link', { name: /Academic Test 14/ }).click();

  await expect(page).toHaveURL(/\/tests\/academic-test-14-14$/);
});

test('isolates a failing row', async ({ page, signIn }) => {
  await signIn('e2e-row-error');
  await page.goto('/');

  await expect(page.getByText("Couldn't load")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByText('Academic Test 14')).toBeVisible();
  await expect(page.getByText('TOEIC SW Test 2')).toBeVisible();
});

test('prefers the row error over the empty state', async ({ page, signIn }) => {
  await signIn('e2e-row-error-empty');
  await page.goto('/');

  await expect(page.getByText("Couldn't load")).toBeVisible();
  await expect(page.getByText('No tests yet')).toHaveCount(0);
});

test('shows the empty state when nothing is published', async ({
  page,
  signIn,
}) => {
  await signIn('e2e-empty');
  await page.goto('/');

  await expect(page.getByText('No tests yet')).toBeVisible();
});

test('greets without a profile', async ({ page, signIn }) => {
  await signIn('e2e-no-profile');
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Hi there' }),
  ).toBeVisible();
});

test('scrolls rows horizontally on mobile', async ({ page, signIn }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signIn();
  await page.goto('/');

  const list = page
    .getByRole('region', { name: 'IELTS Academic' })
    .getByRole('list');
  await expect(list).toBeVisible();
  expect(await list.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
});
