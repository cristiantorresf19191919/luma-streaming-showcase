import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.use({ serviceWorkers: 'block' });
test('personal library separates saved, continuing and purchased with mobile empty states', async ({
  page,
}, info) => {
  await page.goto('/list');
  await expect(page.getByRole('heading', { name: 'Your stories, waiting.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue watching', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pick up right where you left off.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Purchased', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your next movie night lives here.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/library-${info.project.name}.png`, fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
test('guest progress resumes after reload and appears in Continue watching', async ({ page }) => {
  await page.goto('/watch/dune');
  await expect(page.getByText('Your place is saved as you watch.', { exact: true })).toBeVisible();
  const video = page.locator('video');
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.duration)).toBeGreaterThan(5);
  await video.evaluate((v: HTMLVideoElement) => {
    v.currentTime = 3;
    v.dispatchEvent(new Event('pause'));
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('movie:progress:guest') || '{}')['dune-trailer']
            ?.position,
      ),
    )
    .toBeGreaterThanOrEqual(3);
  await page.reload();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThanOrEqual(3);
  await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toBeVisible();
  await expect(video.locator('track')).toHaveAttribute('srclang', 'en');
  await page.goto('/list');
  await page.getByRole('button', { name: 'Continue watching', exact: true }).click();
  await expect(page.locator('.library-row')).toContainText('Dune: Part Two');
  await expect(page.locator('.library-row')).toContainText('Resume at 0:03');
});
test('payment stays unavailable until backend is configured and success URL grants no access', async ({
  page,
}) => {
  await page.route('**/.netlify/functions/commerce-status', (r) =>
    r.fulfill({ json: { checkout: false } }),
  );
  await page.goto('/title/invisibles');
  await expect(page.getByRole('button', { name: 'Watch for $9', exact: true })).toHaveCount(0);
  await expect(page.getByText(/48 hours begin/).first()).toBeVisible();
  await page.goto('/list?tab=purchased&checkout=success');
  await expect(page.locator('.purchase-card')).toHaveCount(0);
  await page.goto('/rental/cs_forged');
  await expect(page.locator('video')).toHaveCount(0);
});
test('install nudge waits for exploration and offers iPhone instructions', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.install-nudge')).toHaveCount(0);
  await page.locator('nav a[href="/movies"]').filter({ visible: true }).click();
  await page.clock.fastForward(46000);
  await expect(page.locator('.install-nudge')).toBeVisible();
  await page
    .locator('.install-nudge')
    .getByRole('button', { name: 'Add to Home Screen', exact: true })
    .click();
  await expect(page.locator('.install-nudge')).toContainText(
    'Open this website in Safari on iPhone.',
  );
  await page
    .locator('.install-nudge')
    .getByRole('button', { name: 'Dismiss installation prompt' })
    .click();
  await expect(page.locator('.install-nudge')).toHaveCount(0);
});
