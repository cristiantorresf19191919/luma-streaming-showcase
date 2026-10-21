import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('account forms, language, keyboard labels and mobile layout', async ({ page }, info) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.getByRole('button', { name: 'Join the audience' }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Movie Fan');
  await page.getByLabel('Email address', { exact: true }).fill('viewer@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-passphrase');
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'A fresh start.' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByLabel('Email address', { exact: true }).focus();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `artifacts/account-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Switch language to Spanish' }).click();
  await expect(page.getByRole('heading', { name: 'Qué bueno verte.' })).toBeVisible();
  await page.getByLabel('Correo electrónico', { exact: true }).fill('persona@example.test');
});

test('Firebase errors are readable and password-reset confirmation is private', async ({
  page,
}) => {
  await page.route(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*',
    (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' } }),
      }),
  );
  await page.route('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/profile');
  const submit = page.getByRole('button', { name: 'Sign in', exact: true });
  await page.getByLabel('Email address', { exact: true }).fill('viewer@example.test');
  await page.getByLabel('Password', { exact: true }).fill('invalid-password');
  test.skip(await submit.isDisabled(), 'Firebase configuration absent');
  await submit.click();
  await expect(page.locator('.account-card').getByRole('status')).toContainText(
    'Email or password is incorrect.',
  );
  await expect(submit).toBeEnabled();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.locator('.account-card').getByRole('status')).toContainText(
    'If an account exists',
  );
});
