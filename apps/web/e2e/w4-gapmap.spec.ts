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
  // The map publishes its plot rectangle and domains, so the test follows the layout instead of hard-coding it.
  const geometry = await chart.evaluate(node => ({ plot: node.getAttribute('data-plot')!.split(',').map(Number), x: node.getAttribute('data-x-domain')!.split(',').map(Number), y: node.getAttribute('data-y-domain')!.split(',').map(Number), box: node.getBoundingClientRect().toJSON(), view: node.getAttribute('viewBox')!.split(' ').map(Number) }));
  const [left, right, top, bottom] = geometry.plot as [number, number, number, number];
  const markX = left + Math.log(101) / Math.log(geometry.x[1]!) * (right - left);
  const markY = bottom - 21 / geometry.y[1]! * (bottom - top);
  await page.mouse.click(chartBounds.x + chartBounds.width * markX / geometry.view[2]!, chartBounds.y + chartBounds.height * markY / geometry.view[3]!);
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
