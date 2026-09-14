import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home renders all artwork without overflow and passes accessibility checks', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Trending this week' })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) => {
        img.loading = 'eager';
        return img.decode();
      }),
    );
  });
  await page.screenshot({ path: `artifacts/home-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('search, filters, saved list and persistence', async ({ page }) => {
  await page.goto('/search');
  const input = page.getByRole('searchbox');
  await input.fill('interstellar');
  await expect(page.locator('luma-film-card')).toHaveCount(1);
  await expect(page).toHaveURL(/q=interstellar/);
  await page.getByRole('button', { name: 'Remove Interstellar', exact: true }).click();
  await page.getByRole('button', { name: 'Save Interstellar', exact: true }).click();
  await page.goto('/list');
  await expect(page.getByRole('link', { name: 'View Interstellar', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'View Interstellar', exact: true })).toBeVisible();
  await page.goto('/movies?genre=Action');
  await expect(page.locator('luma-film-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Sci-Fi', exact: true }).click();
  await expect(page.locator('luma-film-card')).toHaveCount(4);
  await page.goto('/search?q=xxxxxxxx');
  await expect(page.getByRole('heading', { name: 'No stories found. Yet.' })).toBeVisible();
});

test('details, episode navigation, real video playback and companion', async ({ page }, info) => {
  await page.goto('/title/severance');
  await expect(page.getByRole('heading', { name: 'Severance', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /02 A different perspective/ }).click();
  await expect(page).toHaveURL(/watch\/severance\?episode=2/);
  await expect(page.getByText('EPISODE 2', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Story summary', exact: true }).click();
  await expect(page.locator('.companion-response')).toContainText('office workers');
  await page.locator('video').evaluate(async (video: HTMLVideoElement) => {
    video.muted = true;
    await video.play();
  });
  await expect
    .poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0);
  await page.locator('video').evaluate((video: HTMLVideoElement) => video.pause());
  await page.screenshot({ path: `artifacts/player-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Close story companion' }).click();
  await expect(page.locator('.companion')).toHaveCount(0);
  await page.getByRole('button', { name: 'Story companion', exact: true }).click();
  await expect(page.locator('.companion')).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('unknown titles recover and all pages fit narrow screens', async ({ page }) => {
  for (const path of ['/movies', '/series', '/list', '/profile', '/title/dune', '/watch/dune']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto('/title/missing');
  await expect(
    page.getByRole('heading', { name: 'This title took a different turn.' }),
  ).toBeVisible();
});
