import { expect, test } from '@playwright/test';

test('Mission view shares the atlas: switch, four views, shareable URL, click opens the source row', async ({ page }) => {
  await page.goto('/atlas?h=lunar-cabin-example&q=prevention');
  await page.getByRole('button', { name: 'Mission', exact: true }).click();
  await expect(page.getByTestId('mission-view')).toBeVisible();
  await expect(page).toHaveURL(/[?&]v=mission/);
  await expect(page.getByText(/8\s*tests inside Moon base \(example\) air/)).toBeVisible();
  for (const name of ['Air map', 'Oxygen ladder', 'Timeline', 'Orbit']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('button', { name: 'Air map', exact: true }).click();
  await page.waitForTimeout(1800);
  const box = (await page.locator('.mv-canvas').boundingBox())!;
  let selected: string | null = null;
  for (let i = 0; i < 60 && !selected; i++) {
    await page.mouse.click(box.x + box.width * (0.42 + (i % 10) * 0.01), box.y + box.height * (0.52 + Math.floor(i / 10) * 0.01));
    selected = new URL(page.url()).searchParams.get('sel');
  }
  expect(selected).toMatch(/^PSI-\d+:\d+$/);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Gap Map', exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]v=mission/);
});
