import { test, expect } from '@playwright/test';
import { firebaseConfig } from '../src/environments/firebase.generated';
test('progress syncs across sessions; other users and forged purchases are denied', async ({
  page,
  browser,
  request,
  baseURL,
}) => {
  test.skip(
    process.env['E2E_LIVE_AUTH'] !== '1',
    'Creates and removes disposable Firebase accounts',
  );
  test.setTimeout(90000);
  const endpoint = (action: string) =>
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${firebaseConfig.apiKey}`;
  const docs = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
  const users: any[] = [];
  const second = await browser.newContext({ baseURL });
  const other = await second.newPage();
  try {
    for (let i = 0; i < 2; i++) {
      const email = `progress-${Date.now()}-${i}@example.test`,
        password = `Mvp-${crypto.randomUUID()}!`;
      const r = await request.post(endpoint('signUp'), {
        data: { email, password, returnSecureToken: true },
      });
      expect(r.ok()).toBe(true);
      users.push({ email, password, ...(await r.json()) });
    }
    const owner = users[0],
      url = `${docs}/users/${owner.localId}/progress/invisibles-trailer`;
    const body = {
      fields: {
        filmId: { stringValue: 'invisibles' },
        mode: { stringValue: 'trailer' },
        position: { doubleValue: 37 },
        duration: { doubleValue: 120 },
        updatedAt: { doubleValue: Date.now() },
      },
    };
    expect(
      (
        await request.patch(url, {
          headers: { Authorization: `Bearer ${owner.idToken}` },
          data: body,
        })
      ).ok(),
    ).toBe(true);
    for (const tab of [page, other]) {
      await tab.goto('/profile');
      await tab.getByLabel('Email address', { exact: true }).fill(owner.email);
      await tab.getByLabel('Password', { exact: true }).fill(owner.password);
      await tab.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(tab.getByText(owner.email, { exact: true })).toBeVisible();
      await tab.goto('/list');
      await tab.getByRole('button', { name: 'Continue watching', exact: true }).click();
      await expect(tab.locator('.library-row')).toContainText('Resume at 0:37');
    }
    body.fields.position.doubleValue = 58;
    expect(
      (
        await request.patch(url, {
          headers: { Authorization: `Bearer ${owner.idToken}` },
          data: body,
        })
      ).ok(),
    ).toBe(true);
    await expect(page.locator('.library-row')).toContainText('Resume at 0:58');
    await expect(other.locator('.library-row')).toContainText('Resume at 0:58');
    await page.goto('/watch/invisibles');
    await expect(
      page.getByText('Your place is saved as you watch.', { exact: true }),
    ).toBeVisible();
    const video = page.locator('video');
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.duration))
      .toBeGreaterThan(10);
    await video.evaluate((v: HTMLVideoElement) => {
      v.currentTime = 12;
      v.dispatchEvent(new Event('pause'));
    });
    await expect(other.locator('.library-row')).toContainText('Resume at 0:12');
    expect((await request.get(url)).status()).toBe(403);
    for (const method of ['get', 'patch', 'delete'] as const)
      expect(
        (
          await request[method](url, {
            headers: { Authorization: `Bearer ${users[1].idToken}` },
            ...(method === 'patch' ? { data: body } : {}),
          })
        ).status(),
      ).toBe(403);
    body.fields.position.doubleValue = -1;
    expect(
      (
        await request.patch(url, {
          headers: { Authorization: `Bearer ${owner.idToken}` },
          data: body,
        })
      ).status(),
    ).toBe(403);
    const forged = `${docs}/users/${owner.localId}/purchases/cs_forged`;
    expect(
      (
        await request.patch(forged, {
          headers: { Authorization: `Bearer ${owner.idToken}` },
          data: {
            fields: { status: { stringValue: 'paid' }, filmId: { stringValue: 'invisibles' } },
          },
        })
      ).status(),
    ).toBe(403);
  } finally {
    await second.close();
    for (const u of users) {
      await request.delete(`${docs}/users/${u.localId}/progress/invisibles-trailer`, {
        headers: { Authorization: `Bearer ${u.idToken}` },
      });
      expect((await request.post(endpoint('delete'), { data: { idToken: u.idToken } })).ok()).toBe(
        true,
      );
    }
  }
});
