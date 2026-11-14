import { expect, test, type Page } from '@playwright/test';

const readyMap = async (page: Page) => { await page.waitForSelector('.gapmap-chart svg[data-plot]'); };
const chart = (page: Page) => page.getByRole('application', { name: /interactive gap map/i });

test.describe('W7 cross-feature wiring', () => {
  test('exactly one audio bar mounts on the atlas', async ({ page }) => {
    await page.goto('/atlas');
    await readyMap(page);
    await expect(page.locator('[data-audio-bar]')).toHaveCount(1);
    // the timeline is reachable too: the workspace fits between the top bar and the audio bar
    const timeline = page.getByRole('region', { name: 'Test timeline' });
    await expect(timeline).toBeInViewport();
    const audio = await page.locator('[data-audio-bar]').boundingBox();
    const bottom = await timeline.boundingBox();
    expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(audio!.y + 1);
  });

  test('M and 0 reach the map through the shell, one handler each', async ({ page }) => {
    await page.goto('/atlas');
    await readyMap(page);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('m');
    await expect(chart(page)).toBeFocused();
    await expect(page.locator('.gapmap-sr')).toContainText('Mark navigation');
    // pressing M with the map focused turns it off exactly once (no double toggle)
    await page.keyboard.press('m');
    await expect(page.locator('.gapmap-sr')).not.toContainText('Mark navigation');
    // zoom in, then 0 from outside the map fits everything
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(page.getByLabel('Overview map')).toBeVisible();
    await page.locator('#fa-concern').focus();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('0');
    await expect(page.getByLabel('Overview map')).toHaveCount(0);
  });

  test('a focusHabitat cue zooms the map and Fit all cancels the flight', async ({ page }) => {
    await page.goto('/atlas?h=lunar-cabin-example');
    await readyMap(page);
    await expect(page.getByLabel('Overview map')).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('fa:focus-habitat', { detail: { habitat: 'lunar-cabin-example' } })));
    await expect(page.getByLabel('Overview map')).toBeVisible();
    await page.getByRole('button', { name: 'Fit all' }).click();
    await expect(page.getByLabel('Overview map')).toHaveCount(0);
  });

  test('habitat labels sit outside the box and never overlap each other', async ({ page }) => {
    await page.goto('/atlas?h=lunar-cabin-example');
    await readyMap(page);
    const rects = await page.locator('.gapmap-label text, .gapmap-reftext').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { text: node.textContent, x1: b.left, y1: b.top, x2: b.right, y2: b.bottom }; }));
    expect(rects.length).toBeGreaterThan(3);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!, b = rects[j]!;
      const overlap = a.x1 < b.x2 - 1 && a.x2 > b.x1 + 1 && a.y1 < b.y2 - 1 && a.y2 > b.y1 + 1;
      expect(overlap, `${a.text} overlaps ${b.text}`).toBe(false);
    }
    await expect(page.getByText('Earth sea level, 101.3 kPa')).toBeVisible();
    await expect(page.getByText('O₂ (% by volume, ambient)')).toBeVisible();
    await expect(page.getByText('Hollow: burner-stream O₂, not cabin air, excluded from counts')).toBeVisible();
  });

  test('resizing the custom box writes tolerances to the store and counts follow', async ({ page }) => {
    await page.goto('/atlas?h=custom&o2=30&kpa=70.3');
    await readyMap(page);
    const box = page.locator('[data-habitat-box="custom"]');
    const before = (await box.boundingBox())!;
    const seeing = page.locator('.fa-seeing__line');
    const countBefore = await seeing.textContent();
    // drag the east edge outwards
    await page.mouse.move(before.x + before.width, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width + 90, before.y + before.height / 2, { steps: 6 });
    await page.mouse.up();
    const after = (await box.boundingBox())!;
    expect(after.width).toBeGreaterThan(before.width + 40);
    // a rerender that has nothing to do with the box (unit change) keeps the wider box
    await page.locator('#fa-unit').selectOption('psi');
    const later = (await box.boundingBox())!;
    expect(Math.abs(later.width - after.width)).toBeLessThan(3);
    expect(await seeing.textContent()).not.toBe(countBefore);
  });

  test('coach marks follow the briefing, once, and not a direct visit', async ({ page }) => {
    await page.goto('/atlas');
    await readyMap(page);
    await page.waitForTimeout(1400);
    await expect(page.getByRole('dialog', { name: 'Atlas tour' })).toHaveCount(0);
    for (const target of ['habitat-box', 'dot', 'studies']) await expect(page.locator(`[data-coach="${target}"]`)).toHaveCount(1);
    await page.goto('/briefing');
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('open-atlas').click();
    const tour = page.getByRole('dialog', { name: 'Atlas tour' });
    await expect(tour).toBeVisible({ timeout: 8000 });
    await expect(tour).toContainText('Your habitat air');
    await tour.getByRole('button', { name: 'Next' }).click();
    await expect(tour).toContainText('Every dot is a test');
    await tour.getByRole('button', { name: 'Next' }).click();
    await expect(tour).toContainText('Read these studies');
    await tour.getByRole('button', { name: 'Done' }).click();
    await expect(tour).toHaveCount(0);
    // never twice
    await page.goto('/briefing');
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('briefing-next').click();
    await page.getByTestId('open-atlas').click();
    await readyMap(page);
    await page.waitForTimeout(1500);
    await expect(page.getByRole('dialog', { name: 'Atlas tour' })).toHaveCount(0);
    // ? then Replay reopens it
    await page.keyboard.press('?');
    await page.getByRole('button', { name: /Replay the atlas tour/ }).click();
    await expect(page.getByRole('dialog', { name: 'Atlas tour' })).toBeVisible();
  });

  test('clicking the Moon three times opens the partial pressure card', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas[role="img"]').first();
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    const scale = Math.min(box.width / 480, box.height / 270);
    const cx = box.x + (box.width - 480 * scale) / 2 + 285 * scale, cy = box.y + (box.height - 270 * scale) / 2 + 100 * scale;
    for (let i = 0; i < 3; i++) await page.mouse.click(cx, cy);
    await expect(page.getByRole('dialog')).toContainText('almost the same O₂ partial pressure');
  });

  test('playing the timeline to the end shows the corpus status line', async ({ page }) => {
    await page.goto('/atlas');
    await readyMap(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByText(/More to come from LUCI and FM2/)).toBeVisible({ timeout: 12000 });
  });
});
