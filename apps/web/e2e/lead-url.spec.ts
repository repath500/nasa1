import { expect, test } from '@playwright/test';

test('compare parameters survive atlas URL sync', async ({ page }) => {
  await page.goto('/compare?a=PSI-69&b=PSI-25');
  await page.waitForTimeout(1500);
  const url = new URL(page.url());
  expect(url.searchParams.get('a')).toBe('PSI-69');
  expect(url.searchParams.get('b')).toBe('PSI-25');
});

test('Back restores the previous habitat', async ({ page }) => {
  await page.goto('/atlas?h=earth-iss&q=prevention');
  await expect(page.getByText(/The box is ISS/)).toBeVisible({ timeout: 10000 });
  await page.goto('/atlas?h=suit&q=prevention');
  await expect(page.getByText(/The box is Spacesuit/)).toBeVisible({ timeout: 10000 });
  await page.goBack();
  await expect(page.getByText(/The box is ISS/)).toBeVisible({ timeout: 10000 });
});
