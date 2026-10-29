import { expect, test } from './fixtures';

test('signed-in user stays on the homepage', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
});
