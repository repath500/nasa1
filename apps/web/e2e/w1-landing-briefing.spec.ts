import { expect, test } from '@playwright/test';

test('landing -> briefing -> atlas golden path', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hero-h')).toContainText('Where will astronauts breathe');
  await page.getByTestId('cta-briefing').click();
  await expect(page).toHaveURL(/\/briefing/);
  await page.getByTestId('habitat-lunar-cabin-example').check({ force: true });
  await page.getByTestId('briefing-next').click();
  await page.getByTestId('concern-prevention').check({ force: true });
  await expect(page.getByTestId('concern-note')).toBeVisible();
  await page.getByTestId('briefing-next').click();
  await page.getByTestId('fuel-solid').click();
  await page.getByTestId('briefing-next').click();
  await expect(page.getByTestId('briefing-sentence')).toContainText('30% O₂');
  await page.getByTestId('open-atlas').click();
  await expect(page).toHaveURL(/\/atlas\?.*h=lunar-cabin-example/);
  await expect(page.getByTestId('audio-bar')).toBeVisible();
});

test('palette opens with the keyboard and finds a habitat', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByTestId('palette-input')).toBeVisible();
  await page.getByTestId('palette-input').fill('moon');
  await expect(page.getByRole('option', { name: /Moon base/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('palette-input')).toBeHidden();
});
