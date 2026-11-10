import { expect, test } from './fixtures';

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

test.describe('email sign-in', () => {
  test('signs in with the right password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@example.com');
    await page.getByLabel('Password').fill('secret123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows an error for a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('student@example.com');
  });

  test('sends an unverified account to email verification', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('unverified@example.com');
    await page.getByLabel('Password').fill('secret123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(
      /\/verify-email\?email=unverified%40example\.com$/,
    );
  });
});

test('registers, verifies the email and lands signed in', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.getByLabel('First name').fill('Lan');
  await page.getByLabel('Email').fill('lan@example.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/verify-email\?email=lan%40example\.com$/);

  const code = page.getByRole('textbox', { name: 'Verification code' });
  await code.pressSequentially('000000');
  await expect(
    page.getByText(/The code is wrong or has expired/),
  ).toBeVisible();

  await code.fill('');
  await code.pressSequentially('123456');
  await expect(page).toHaveURL(/\/$/);
});

test('resets a forgotten password', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Email').fill('student@example.com');
  await page.getByRole('button', { name: 'Send reset code' }).click();
  await expect(page).toHaveURL(
    /\/reset-password\?email=student%40example\.com$/,
  );

  await page
    .getByRole('textbox', { name: 'Reset code' })
    .pressSequentially('123456');
  await page.getByLabel('New password', { exact: true }).fill('newsecret1');
  await page.getByLabel('Confirm new password').fill('newsecret1');
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page).toHaveURL(/\/login\?notice=password_reset$/);
  await expect(page.getByText('Password updated')).toBeVisible();
});

test('auth pages send a signed-in user home', async ({ page, signIn }) => {
  await signIn();
  for (const path of ['/register', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
});
