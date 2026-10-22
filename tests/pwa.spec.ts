import { test, expect } from '@playwright/test';
test('production app installs its worker and opens offline without caching private APIs', async ({
  page,
  context,
  request,
}) => {
  test.skip(
    process.env['E2E_PWA'] !== '1',
    'Requires a production build served over localhost or HTTPS.',
  );
  test.setTimeout(90000);
  await page.goto('/');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(
    manifest.icons.some((icon: { purpose: string }) => icon.purpose.includes('maskable')),
  ).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20000 })
    .toBe(true);
  const config = await (await request.get('/ngsw.json')).json();
  await expect
    .poll(
      () =>
        page.evaluate(
          async (urls: string[]) =>
            (await Promise.all(urls.map((url) => caches.match(url)))).every(Boolean),
          config.assetGroups[0].urls,
        ),
      { timeout: 60000 },
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /INVISIBLE'S/ })).toBeVisible();
  await page.getByRole('button', { name: 'View offer' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await context.setOffline(false);
  expect(config.dataGroups).toEqual([]);
  expect(JSON.stringify(config.assetGroups)).not.toContain('googleapis.com');
  expect(JSON.stringify(config.assetGroups)).not.toContain('.mp4');
});
