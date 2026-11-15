import { expect, test } from '@playwright/test';

test('landing: access button wipes then opens the atlas on the Moon example', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hero-h')).toContainText('Where will astronauts breathe');
  await page.getByTestId('cta-enter').click();
  await expect(page).toHaveURL(/\/atlas\?.*h=lunar-cabin-example.*q=prevention|\/atlas\?.*q=prevention.*h=lunar-cabin-example/, { timeout: 10000 });
});

test('landing: live numbers come from the corpus and the credit line is present', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/An experimental app for NASA Space Apps x HackAthlone hackathon 2026, by Jay.Popat \(currently at Fidelity.Investments\) and Repath.Khan \(currently at Leemer.Group\)/).first()).toBeVisible();
  await expect(page.getByTestId('view-challenge')).toHaveAttribute('href', 'https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/');
  await expect(page.getByRole('heading', { name: 'Where code does the science, and why' })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'How we built it' })).toBeAttached();
  const stats = page.getByLabel('Live from the loaded corpus');
  await expect(stats).toContainText('test rows parsed');
  await expect(stats.locator('dd .num').first()).not.toHaveText('0');
});

test('landing: reduced motion shows no dither cover and the page does not scroll sideways at 375 px', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('#hero-h')).toBeVisible();
  await expect(page.locator('.lp-cover')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await ctx.close();
});
