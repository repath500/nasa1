import { expect, test } from '@playwright/test';

test('briefing is completable with the keyboard alone', async ({ page }) => {
  await page.goto('/briefing');
  const habitat = page.getByTestId('habitat-earth-iss');
  await habitat.focus();
  await page.keyboard.press('ArrowDown'); // radio group moves selection
  await expect(page.locator('input[name=habitat]:checked')).toHaveCount(1);
  const next = page.getByTestId('briefing-next');
  await next.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'What worries you most?' })).toBeFocused();
  await next.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Anything specific?' })).toBeFocused();
  await page.getByTestId('fuel-liquid-droplet').focus(); await page.keyboard.press('Space');
  await next.focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('briefing-sentence')).toBeVisible();
  await page.getByTestId('open-atlas').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/atlas/);
});

test('shortcuts: ? sheet, T theme, E expert, typing in a field is ignored', async ({ page }) => {
  await page.goto('/learn');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: /Keyboard shortcuts/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('t');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.keyboard.press('Control+k');
  await page.getByTestId('palette-input').fill('tte');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
});

test('esc skips the briefing to the atlas and 404 drifts', async ({ page }) => {
  await page.goto('/briefing');
  await expect(page.getByRole('heading', { name: 'Where will crews breathe?' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/atlas/);
  await page.goto('/nowhere');
  await expect(page.getByRole('heading', { name: /drifted out of the corpus/ })).toBeVisible();
});

test('present mode steps through beats with the keyboard', async ({ page }) => {
  await page.goto('/present');
  await expect(page.getByTestId('beat-slide')).toContainText('Where will astronauts breathe');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('beat-slide')).toContainText('nothing falls');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('beat-card')).toBeVisible();
  for (let i = 0; i < 4; i++) await page.keyboard.press('PageDown');
  await expect(page.getByTestId('beat-slide')).toContainText('does not claim');
});

test('learn page: oxygen slider and no AI calls @phone', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/api/') && !r.url().includes('/api/health')) calls.push(r.url()); });
  await page.goto('/learn');
  await expect(page.getByTestId('incidents')).toBeVisible();
  await page.getByTestId('gravity-micro').check({ force: true });
  await expect(page.getByTestId('candle-text')).toContainText('dim blue sphere');
  await page.getByTestId('o2-slider').focus(); await page.keyboard.press('End');
  await expect(page.getByTestId('o2-value')).toContainText('100%');
  expect(calls).toEqual([]);
});
