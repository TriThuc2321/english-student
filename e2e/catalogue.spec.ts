import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

const cards = (page: Page) =>
  page.getByRole('main').getByRole('listitem').getByRole('link');
const searchField = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search tests' });

test.beforeEach(async ({ signIn }) => {
  await signIn();
});

test('lists all tests newest first with a summary', async ({ page }) => {
  await page.goto('/tests');

  await expect(cards(page)).toHaveCount(12);
  await expect(cards(page).first()).toContainText('Academic Test 14');
  await expect(page.getByText('Showing 1–12 of 19')).toBeVisible();
});

test('paginates', async ({ page }) => {
  await page.goto('/tests');
  await page.getByRole('button', { name: '2', exact: true }).click();

  await expect(page).toHaveURL(/\/tests\?page=2$/);
  await expect(cards(page)).toHaveCount(7);
  await expect(page.getByText('Showing 13–19 of 19')).toBeVisible();
});

test('filters by tab and resets page', async ({ page }) => {
  await page.goto('/tests?page=2');
  await page.getByRole('tab', { name: 'TOEIC Speaking & Writing' }).click();

  await expect(page).toHaveURL(/\/tests\?exam=TOEIC_SW$/);
  await expect(cards(page)).toHaveCount(2);
});

test('searches with debounce', async ({ page }) => {
  await page.goto('/tests');
  // Pausing after the space lets the URL update mid-word; the field must keep the space and focus.
  await searchField(page).pressSequentially('toeic ');
  await expect(page).toHaveURL(/\/tests\?q=toeic$/);
  await searchField(page).pressSequentially('sw');

  await expect(page).toHaveURL(/\/tests\?q=toeic\+sw$/);
  await expect(cards(page)).toHaveCount(2);
  await expect(searchField(page)).toBeFocused();
  await expect(searchField(page)).toHaveValue('toeic sw');
});

test('clears filters from the empty state', async ({ page }) => {
  await page.goto('/tests?q=zzz');
  await expect(page.getByText('No matching tests')).toBeVisible();
  await page.getByRole('link', { name: 'Clear filters' }).click();

  await expect(page).toHaveURL(/\/tests$/);
  await expect(searchField(page)).toHaveValue('');
  await expect(cards(page)).toHaveCount(12);
});

test('falls back on invalid params', async ({ page }) => {
  await page.goto('/tests?exam=FOO&page=abc');

  await expect(page.getByRole('tab', { name: 'All' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Showing 1–12 of 19')).toBeVisible();
});

test('redirects past the last page', async ({ page }) => {
  await page.goto('/tests?page=99');

  await expect(page).toHaveURL(/\/tests\?page=2$/);
});

test('accepts a 300-character query', async ({ page }) => {
  await page.goto(`/tests?q=${'a'.repeat(300)}`);

  await expect(page.getByText('No matching tests')).toBeVisible();
  expect((await searchField(page).inputValue()).length).toBe(255);
});

test('shows the error page when the API fails', async ({ page, signIn }) => {
  await signIn('e2e-error');
  await page.goto('/tests');

  await expect(page.getByText('Something went wrong')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('uses one column on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/tests');

  const [first, second] = await Promise.all([
    cards(page).nth(0).boundingBox(),
    cards(page).nth(1).boundingBox(),
  ]);
  expect(first?.x).toBe(second?.x);
});
