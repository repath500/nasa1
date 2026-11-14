import { expect, test } from '@playwright/test';

test.describe('W5 atlas workspace', () => {
  test('loads the fixture corpus, shows the two ranker table and opens a study from a row', async ({ page }) => {
    await page.goto('/atlas');
    await expect(page.getByRole('tab', { name: /Studies/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.fa-badge--fixture').first()).toBeVisible();
    await expect(page.getByText('Preview: cards not yet human-reviewed.')).toBeVisible();
    const table = page.getByRole('table', { name: /Studies ranked/ });
    await expect(table).toBeVisible();
    const flex = table.getByRole('row', { name: /FLEX, baseline rank/ });
    await expect(flex).toBeVisible();
    await expect(page.getByText(/Jev (#|relevance)/).first()).toBeVisible();
    await flex.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/study\/PSI-69/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('FLEX');
  });

  test('studies rows are reachable by keyboard with a roving tabindex', async ({ page }) => {
    await page.goto('/atlas');
    const rows = page.getByRole('table', { name: /Studies ranked/ }).getByRole('row', { name: /baseline rank/ });
    await expect(rows.first()).toBeVisible();
    await rows.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(1)).toBeFocused();
    await expect(rows.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(rows.first()).toHaveAttribute('tabindex', '-1');
  });

  test('ledger tab lists the rejected 3400% cell', async ({ page }) => {
    await page.goto('/atlas?tab=ledger');
    await expect(page.getByText('3400%')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('O₂ outside 0 to 100%', { exact: true }).first()).toBeVisible();
  });

  test('hovering the 3400% cell for 3 seconds shows the tooltip', async ({ page }) => {
    await page.goto('/atlas?tab=ledger');
    const cell = page.getByText('3400%');
    await expect(cell).toBeVisible({ timeout: 8000 });
    await cell.hover();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(page.getByRole('tooltip')).toContainText('Even a spacecraft cannot hold 3400% oxygen', { timeout: 6000 });
  });
});
