import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
test('compact install prompt leaves library tabs usable at narrow mobile widths', async ({
  page,
}) => {
  for (const width of [288, 320, 390]) {
    await page.setViewportSize({ width, height: 667 });
    await page.clock.install();
    await page.goto('/list');
    await page.evaluate(() =>
      localStorage.setItem(
        'movie:progress:guest',
        JSON.stringify({
          'invisibles-trailer': {
            filmId: 'invisibles',
            mode: 'trailer',
            position: 12,
            duration: 37,
            updatedAt: Date.now(),
          },
        }),
      ),
    );
    await page.reload();
    await page.getByRole('link', { name: 'Find your next story', exact: true }).click();
    await page.locator('nav a[href="/list"]').filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/list$/);
    await page.clock.fastForward(46000);
    const prompt = page.locator('.install-nudge');
    await expect(prompt).toBeVisible();
    expect(await prompt.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(
      100,
    );
    for (const name of ['Purchased', 'My List', 'Continue watching']) {
      const tab = page.getByRole('button', { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-pressed', 'true');
      expect(
        await tab.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }),
      ).toBe(true);
    }
    await expect(page.locator('.library-row')).toContainText('Resume at 0:12');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await prompt.getByRole('button', { name: 'Add to Home Screen', exact: true }).click();
    await expect(
      prompt.getByText('Open this website in Safari on iPhone.', { exact: true }),
    ).toBeVisible();
    await prompt.getByRole('button', { name: 'Hide instructions' }).click();
    await expect(prompt.getByRole('list')).toHaveCount(0);
    await page.screenshot({ path: `artifacts/compact-library-${width}.png` });
  }
});
