import { expect, test } from '@playwright/test';

test.describe('W5 evidence drawer', () => {
  test('opens from the URL, steps with ] and [, and closes with Escape', async ({ page }) => {
    await page.goto('/atlas?sel=PSI-69:19');
    const drawer = page.getByRole('dialog', { name: /Evidence:/ });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Raw cells as written')).toBeVisible();
    await expect(drawer.getByText('Heptane').or(drawer.getByText('Methanol')).first()).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-label', /FLEX/);
    const before = await drawer.getAttribute('aria-label');
    await page.keyboard.press(']');
    await expect(drawer).not.toHaveAttribute('aria-label', before ?? '');
    await page.keyboard.press('[');
    await expect(drawer).toHaveAttribute('aria-label', before ?? '');
    await expect(drawer.getByRole('button', { name: /Copy citation \(APA\)/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('shows microgravity and partial gravity wording, and never an unknown as zero', async ({ page }) => {
    await page.goto('/atlas?sel=PSI-25:0');
    const drawer = page.getByRole('dialog', { name: /Evidence:/ });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Partial gravity: none in PSI').first()).toBeVisible();
    await expect(drawer.getByText('not reported').first()).toBeVisible();
  });
});
