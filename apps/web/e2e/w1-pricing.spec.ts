import { expect, test } from '@playwright/test';

const health = (stripe: boolean, mode: 'test' | 'live' | 'off') => ({ ok: true, services: { jev: false, gemini: false, elevenlabs: false, stripe }, stripeMode: mode });

test('pricing with billing unconfigured disables pay buttons with a reason', async ({ page }) => {
  await page.route('**/api/health', (r) => r.fulfill({ json: health(false, 'off') }));
  await page.goto('/pricing');
  await expect(page.getByTestId('principle')).toContainText('Every piece of NASA-derived evidence is free.');
  const pay = page.getByTestId('pay-researcher');
  await expect(pay).toBeDisabled();
  await expect(page.getByText('Billing not configured').first()).toBeVisible();
  await page.getByTestId('interval-year').check({ force: true });
  await expect(page.getByText('$79', { exact: false }).first()).toBeVisible();
});

test('pricing in test mode shows the label and redirects to the checkout url', async ({ page }) => {
  await page.route('**/api/health', (r) => r.fulfill({ json: health(true, 'test') }));
  let body: unknown = null;
  await page.route('**/api/checkout', async (r) => { body = r.request().postDataJSON(); await r.fulfill({ json: { url: '/checkout/cancel' } }); });
  await page.goto('/pricing');
  await expect(page.getByText('Test mode, no real charge').first()).toBeVisible();
  await page.getByTestId('pay-researcher').click();
  await expect(page).toHaveURL(/\/checkout\/cancel/);
  expect(body).toEqual({ plan: 'researcher', interval: 'month' });
});

test('checkout success claims the licence', async ({ page }) => {
  await page.route('**/api/license/claim', (r) => r.fulfill({ json: { token: 't.k', plan: 'researcher', expiresAt: '2027-01-01T00:00:00Z' } }));
  await page.goto('/checkout/success?session_id=cs_test_123');
  await expect(page.getByTestId('claim-plan')).toContainText('Researcher');
  expect(await page.evaluate(() => localStorage.getItem('fa.license'))).toBe('t.k');
});
