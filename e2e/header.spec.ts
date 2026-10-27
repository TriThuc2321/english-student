import { expect, test } from './fixtures';

test('shows the user menu with name and email', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');
  await page.getByRole('button', { name: 'Account menu' }).click();

  await expect(page.getByText('Linh Nguyen')).toBeVisible();
  await expect(page.getByText('linh@example.com')).toBeVisible();
});

test('logs out to /login', async ({ page, signIn }) => {
  await signIn();
  await page.goto('/');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await expect(page).toHaveURL(/\/login$/);
});

test('renders without a profile', async ({ page, signIn }) => {
  await signIn('e2e-no-profile');
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Tests' })).toBeVisible();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByText('linh@example.com')).toHaveCount(0);
});

test('uses a drawer on mobile', async ({ page, signIn }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signIn();
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Tests' })).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawerLink = page
    .getByRole('dialog')
    .getByRole('link', { name: 'Tests' });
  await expect(drawerLink).toBeVisible();
  await drawerLink.click();

  await expect(page).toHaveURL(/\/tests$/);
});
