import { expect, test } from '@playwright/test';

test('redirects to /login without a session', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('login page offers Google sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('a[href="/api/session/google"]')).toBeVisible();
});

test('login page shows the error alert', async ({ page }) => {
  await page.goto('/login?error=google_login_failed');
  await expect(page.getByRole('alert')).toBeVisible();
});
