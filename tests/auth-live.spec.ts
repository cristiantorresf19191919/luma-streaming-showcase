import { test, expect } from '@playwright/test';
import { firebaseConfig } from '../src/environments/firebase.generated';

test('real Firebase signup, persistent session, account-isolated list and sign-in', async ({
  page,
  request,
}) => {
  test.skip(
    process.env['E2E_LIVE_AUTH'] !== '1',
    'Opt-in only: creates and removes a disposable Firebase test user.',
  );
  const email = `mvp-check-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const password = `Mvp-${crypto.randomUUID()}!`;
  const endpoint = (action: string) =>
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${firebaseConfig.apiKey}`;
  try {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Join the audience' }).click();
    await page.getByLabel('Your name', { exact: true }).fill('MVP Viewer');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome, MVP Viewer' })).toBeVisible({
      timeout: 20000,
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome, MVP Viewer' })).toBeVisible();
    await page.goto('/search?q=dune');
    await page.getByRole('button', { name: 'Save Dune: Part Two', exact: true }).click();
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await page.goto('/list');
    await expect(page.locator('luma-film-card')).toHaveCount(0);
    await page.goto('/profile');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome, MVP Viewer' })).toBeVisible();
    await page.goto('/list');
    await expect(page.locator('luma-film-card')).toHaveCount(1);
  } finally {
    const signedIn = await request.post(endpoint('signInWithPassword'), {
      data: { email, password, returnSecureToken: true },
    });
    if (signedIn.ok()) {
      const { idToken } = await signedIn.json();
      const deleted = await request.post(endpoint('delete'), { data: { idToken } });
      expect(deleted.ok(), 'Disposable test user cleaned up').toBe(true);
    }
  }
});

test('Google provider accepts the production domain', async ({ request }) => {
  test.skip(process.env['E2E_LIVE_AUTH'] !== '1', 'Opt-in live provider check.');
  const response = await request.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`,
    {
      data: { providerId: 'google.com', continueUri: 'https://moviesdiamond.netlify.app/profile' },
    },
  );
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(new URL(data.authUri).hostname).toBe('accounts.google.com');
});
