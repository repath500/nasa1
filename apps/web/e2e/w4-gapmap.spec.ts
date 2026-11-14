if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Playwright browser coverage runs separately', () => {});
} else {
  const { expect, test } = await import('@playwright/test');
  test('map zoom, selection, navigation and synthetic pan', async ({ page }) => {
  await page.goto('/src/features/gapmap/playground.html');
  const chart = page.getByRole('application', { name: /interactive gap map/i });
  const ticks = chart.locator('.gapmap-grid text');
  const before = await ticks.allTextContents();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => ticks.allTextContents()).not.toEqual(before);
  await page.getByRole('button', { name: 'Fit all' }).click();
  const chartBounds = await chart.boundingBox();
  if (!chartBounds) throw new Error('Chart has no bounds');
  const markX = 115 + Math.log(101) / Math.log(165) * 750;
  const markY = 410 - 21 / 49.5 * 375;
  await page.mouse.click(chartBounds.x + chartBounds.width * markX / 900, chartBounds.y + chartBounds.height * markY / 500);
  await expect(page.getByLabel('Selected row')).not.toHaveText('None');
  await chart.click({ position: { x: 10, y: 10 } });
  await expect(page.getByLabel('Selected row')).toHaveText('None');
  await chart.focus();
  await page.keyboard.press('m');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Selected row')).not.toHaveText('None');
  await page.keyboard.press('m');
  await page.getByRole('button', { name: 'Use 2,000 synthetic rows' }).click();
  await page.getByRole('button', { name: 'Fit all' }).click();
  const bounds = await chart.boundingBox();
  if (!bounds) throw new Error('Chart has no bounds');
  await page.evaluate(() => {
    const state = window as Window & { frameSamples?: number[]; sampling?: boolean };
    state.frameSamples = [];
    state.sampling = true;
    let previous = performance.now();
    const frame = (now: number) => { state.frameSamples?.push(now - previous); previous = now; if (state.sampling) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  });
  const startX = bounds.x + bounds.width * .35;
  const startY = bounds.y + bounds.height * .55;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let index = 0; index < 120; index++) {
    await page.mouse.move(startX + index, startY + Math.sin(index / 15) * 10);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }
  await page.mouse.up();
  const samples = await page.evaluate(() => { const state = window as Window & { frameSamples?: number[]; sampling?: boolean }; state.sampling = false; return state.frameSamples ?? []; });
  samples.sort((left, right) => left - right);
  console.log(`Synthetic pan frame intervals: median ${samples[Math.floor(samples.length * .5)]?.toFixed(1)} ms, p95 ${samples[Math.floor(samples.length * .95)]?.toFixed(1)} ms`);
  });
}
