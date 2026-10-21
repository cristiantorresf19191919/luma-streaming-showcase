import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home renders all artwork without overflow and passes accessibility checks', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A little preview of what’s to come.' }),
  ).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'movie home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Optimus' })).toHaveAttribute(
    'href',
    'https://agencypartner2.netlify.app/',
  );
  await expect(page.getByText('This is a skeleton', { exact: false })).toBeVisible();
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
  await input.fill('dune');
  await expect(page.locator('luma-film-card')).toHaveCount(1);
  await expect(page).toHaveURL(/q=dune/);
  await page.getByRole('button', { name: 'Save Dune: Part Two', exact: true }).click();
  await page.goto('/list');
  await expect(page.getByRole('link', { name: 'View Dune: Part Two', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'View Dune: Part Two', exact: true })).toBeVisible();
  await page.goto('/movies?genre=Action');
  await expect(page.locator('luma-film-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sci-Fi', exact: true }).click();
  await expect(page.locator('luma-film-card')).toHaveCount(1);
  await page.goto('/search?q=xxxxxxxx');
  await expect(page.getByRole('heading', { name: 'No stories found. Yet.' })).toBeVisible();
});

test('details, real video playback and companion', async ({ page }, info) => {
  await page.goto('/title/dune');
  await expect(page.getByRole('heading', { name: 'Dune: Part Two', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Watch now', exact: true }).click();
  await expect(page).toHaveURL(/watch\/dune/);
  await page.getByRole('button', { name: 'Story summary', exact: true }).click();
  await expect(page.locator('.companion-response')).toContainText('Destiny is written in sand');
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
