import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.use({ serviceWorkers: 'block' });
test('plans, card preview and launch form work on touch and desktop', async ({ page }, info) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Explore plans' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('$9.99', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'One movie', exact: true }).click();
  await expect(dialog.getByText('$4.99', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Preview card payment' }).click();
  await expect(dialog.getByText(/Illustration only/)).toBeVisible();
  expect(await dialog.locator('input').count()).toBe(3); // Email, consent, honeypot; no card fields.
  const discount = dialog.getByRole('button', { name: 'Get my 20% launch offer' });
  if (await discount.isVisible()) await discount.click();
  await dialog.getByLabel('Your email', { exact: true }).fill('test@example.test');
  await dialog.getByRole('checkbox').check();
  await page.route('**/__forms.html', (route) => route.fulfill({ status: 503 }));
  await dialog.getByRole('button', { name: 'Reserve my 20% launch offer' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.unroute('**/__forms.html');
  let submitted = '';
  await page.route('**/__forms.html', (route) => {
    submitted = route.request().postData() || '';
    return route.fulfill({ status: 200, body: 'Saved' });
  });
  const audit = await new AxeBuilder({ page })
    .include('dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await dialog.screenshot({ path: `artifacts/plans-${info.project.name}.png` });
  await dialog.getByRole('button', { name: 'Reserve my 20% launch offer' }).click();
  await expect(dialog.getByText('You’re on the list.', { exact: true })).toBeVisible();
  expect(new URLSearchParams(submitted).get('plan')).toBe('night');
  expect(new URLSearchParams(submitted).get('email')).toBe('test@example.test');
  await dialog.getByRole('button', { name: 'Close plans' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
test('Spanish offers and installation guidance fit narrow screens', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('luma:lang', 'es'));
  await page.reload();
  await page.getByRole('button', { name: 'Explorar planes' }).first().click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Haz de una noche tu gran noche.' }),
  ).toBeVisible();
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Cerrar planes' }).click();
  await page.getByRole('button', { name: /Añade movie/ }).click();
  await expect(page.getByText(/En iPhone: abre Safari/)).toBeVisible();
});

test('mobile plans and discount action fit without scrolling', async ({ page }) => {
  for (const [width, height] of [
    [390, 844],
    [375, 667],
  ]) {
    await page.setViewportSize({ width, height });
    for (const lang of ['en', 'es']) {
      await page.goto('/');
      await page.evaluate((lang) => localStorage.setItem('luma:lang', lang), lang);
      await page.reload();
      await page
        .getByRole('button', {
          name: lang === 'en' ? 'Explore plans' : 'Explorar planes',
          exact: true,
        })
        .click();
      const dialog = page.getByRole('dialog');
      const cta = dialog.getByRole('button', {
        name: lang === 'en' ? 'Get my 20% launch offer' : 'Obtener mi oferta del 20%',
      });
      await expect(cta).toBeInViewport({ ratio: 1 });
      await expect(
        dialog.getByRole('group', { name: lang === 'en' ? 'Choose a plan' : 'Elige un plan' }),
      ).toBeInViewport({ ratio: 1 });
      expect(await dialog.evaluate((el) => el.scrollTop)).toBe(0);
      await dialog.screenshot({ path: `artifacts/compact-${width}-${lang}.png` });
    }
  }
});
