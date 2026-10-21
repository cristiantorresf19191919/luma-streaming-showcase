import { test, expect, type Page } from '@playwright/test';
import { firebaseConfig } from '../src/environments/firebase.generated';
test('live lists migrate once, sync between devices, and deny other users', async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  test.skip(
    process.env['E2E_LIVE_AUTH'] !== '1',
    'Creates and cleans up disposable Firebase accounts and lists.',
  );
  test.setTimeout(90000);
  const endpoint = (action: string) =>
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${firebaseConfig.apiKey}`;
  const users: { email: string; password: string; idToken: string; localId: string }[] = [];
  const second = await browser.newContext();
  const otherPage = await second.newPage();
  const base = new URL(baseURL || 'http://127.0.0.1:4200');
  const docs = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
  try {
    for (let i = 0; i < 2; i++) {
      const email = `sync-${Date.now()}-${i}@example.test`,
        password = `Mvp-${crypto.randomUUID()}!`;
      const response = await request.post(endpoint('signUp'), {
        data: { email, password, returnSecureToken: true },
      });
      expect(response.ok()).toBe(true);
      users.push({ email, password, ...(await response.json()) });
    }
    const owner = users[0];
    const login = async (tab: Page) => {
      await tab.goto(new URL('/profile', base).href);
      await tab.getByLabel('Email address', { exact: true }).fill(owner.email);
      await tab.getByLabel('Password', { exact: true }).fill(owner.password);
      await tab.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(tab.getByText('Synced across your devices', { exact: true })).toBeVisible({
        timeout: 20000,
      });
    };
    await page.goto('/profile');
    await page.evaluate(
      (uid) => localStorage.setItem(`luma:list:${uid}`, '["invisibles"]'),
      owner.localId,
    );
    await login(page);
    await page.goto('/list');
    await expect(page.locator('luma-film-card')).toHaveCount(1);
    await expect
      .poll(() => page.evaluate((uid) => localStorage.getItem(`luma:list:${uid}`), owner.localId))
      .toBeNull();
    await login(otherPage);
    await otherPage.goto(new URL('/search?q=dune', base).href);
    await otherPage.getByRole('button', { name: 'Save Dune: Part Two', exact: true }).click();
    await expect(otherPage.locator('.toast')).toHaveText('Added to your list');
    await expect(page.locator('luma-film-card')).toHaveCount(2);
    await page.getByRole('button', { name: /Remove Invisible/ }).click();
    await otherPage.goto(new URL('/list', base).href);
    await expect(otherPage.locator('luma-film-card')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('luma-film-card')).toHaveCount(1);
    const url = `${docs}/users/${owner.localId}/watchlist/dune`;
    const badHeaders = { Authorization: `Bearer ${users[1].idToken}` };
    expect((await request.get(url)).status()).toBe(403);
    expect((await request.get(url, { headers: badHeaders })).status()).toBe(403);
    expect(
      (
        await request.get(`${docs}/users/${owner.localId}/watchlist`, { headers: badHeaders })
      ).status(),
    ).toBe(403);
    expect((await request.delete(url, { headers: badHeaders })).status()).toBe(403);
    expect(
      (
        await request.patch(url, {
          headers: badHeaders,
          data: { fields: { saved: { booleanValue: true } } },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(url, {
          headers: { Authorization: `Bearer ${owner.idToken}` },
          data: { fields: { saved: { stringValue: 'invalid' } } },
        })
      ).status(),
    ).toBe(403);
  } finally {
    await second.close();
    for (const user of users) {
      for (const id of ['dune', 'invisibles']) {
        expect(
          (
            await request.delete(`${docs}/users/${user.localId}/watchlist/${id}`, {
              headers: { Authorization: `Bearer ${user.idToken}` },
            })
          ).ok(),
        ).toBe(true);
      }
      expect(
        (await request.post(endpoint('delete'), { data: { idToken: user.idToken } })).ok(),
      ).toBe(true);
    }
  }
});
