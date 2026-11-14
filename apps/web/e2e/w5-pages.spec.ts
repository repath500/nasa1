import { expect, test } from '@playwright/test';

test.describe('W5 pages', () => {
  test('compare declines a droplet versus film comparison and says why', async ({ page }) => {
    await page.goto('/compare?a=PSI-69&b=PSI-25');
    await expect(page.getByText('A direct comparison is not meaningful here.')).toBeVisible();
    await expect(page.getByText(/Fuel phase differs/)).toBeVisible();
  });

  test('study page renders every section for a study', async ({ page }) => {
    await page.goto('/study/PSI-25');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('BASS-II');
    for (const h of ['Objective', 'Conditions tested', 'Why this rank', 'Transfer limits', 'Related studies, same hardware family']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
  });

  test('unknown study says so instead of guessing', async ({ page }) => {
    await page.goto('/study/PSI-9999');
    await expect(page.getByText(/is not in the loaded corpus/)).toBeVisible();
  });

  test('brief has a QR code, a citation and the non-endorsement line', async ({ page }) => {
    await page.goto('/brief/lunar-cabin-example?h=lunar-cabin-example&q=prevention');
    await expect(page.getByRole('img', { name: /QR code linking/ })).toBeVisible();
    await expect(page.getByText('NASA does not endorse this project.', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Citations' })).toBeVisible();
  });

  test('about, method and credits render with required attribution', async ({ page }) => {
    await page.goto('/credits');
    await expect(page.getByText('10.60555/mbq8-0451')).toBeVisible();
    await expect(page.getByText('GOV_PUBLIC_USE_PERMITTED').first()).toBeVisible();
    await expect(page.getByText(/PLACEHOLDER, written by the human team/).first()).toBeVisible();
    await page.goto('/method');
    await expect(page.getByRole('heading', { name: 'Limits', exact: true })).toBeVisible();
    await page.goto('/about');
    await expect(page.getByText('NASA does not endorse this project.', { exact: false }).first()).toBeVisible();
  });
});
