import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** SPEC 15: axe-core must report 0 serious or critical issues. Every page is scanned in the Night, Paper and High Contrast themes. */
const PAGES: { path: string; ready: (page: Page) => Promise<unknown> }[] = [
  { path: '/', ready: page => page.locator('#hero-h').waitFor() },
  { path: '/briefing', ready: page => page.getByTestId('briefing').waitFor() },
  { path: '/atlas', ready: async page => { await page.waitForSelector('.gapmap-chart svg[data-plot]'); await page.getByRole('table', { name: /Studies ranked/ }).waitFor(); } },
  { path: '/study/PSI-69', ready: page => page.getByRole('heading', { level: 1 }).first().waitFor() },
  { path: '/about', ready: page => page.getByRole('heading', { level: 1 }).first().waitFor() },
];
const THEMES = ['night', 'paper', 'contrast'] as const;

for (const theme of THEMES) {
  for (const target of PAGES) {
    test(`axe: ${target.path} in ${theme}`, async ({ page }) => {
      await page.addInitScript(([t]) => { try { localStorage.setItem('fa.theme', t!); localStorage.setItem('fa.coach.seen', JSON.stringify({ atlas: true })); } catch { /* storage blocked */ } }, [theme]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(target.path);
      await target.ready(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.waitForTimeout(600); // fonts and lazy panels settle
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      const other = result.violations.filter(v => !bad.includes(v));
      console.log(`AXE ${theme} ${target.path}: serious/critical ${bad.reduce((n, v) => n + v.nodes.length, 0)} nodes in ${bad.length} rules; other ${other.reduce((n, v) => n + v.nodes.length, 0)} nodes in ${other.length} rules`);
      for (const v of other) console.log(`  (${v.impact}) ${v.id}: ${v.nodes.length} nodes`);
      expect(bad.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => `${n.target.join(' ')} :: ${(n.any[0] ?? n.all[0] ?? n.none[0])?.message ?? n.failureSummary}`) }))).toEqual([]);
    });
  }
}

/** Deeper states of the atlas: the drawer, the other panel tabs, the tour, the table view and a phone viewport. */
const STATES: { name: string; path: string; viewport?: { width: number; height: number }; prepare?: (page: Page) => Promise<unknown>; coach?: boolean }[] = [
  { name: 'evidence drawer open', path: '/atlas?sel=PSI-69:19', prepare: page => page.getByRole('dialog', { name: /Evidence:/ }).waitFor() },
  { name: 'caught by code tab', path: '/atlas?tab=ledger', prepare: page => page.getByText('3400%').waitFor({ timeout: 8000 }) },
  { name: 'notes tab', path: '/atlas?tab=notes' },
  { name: 'selection tab', path: '/atlas?tab=selection' },
  { name: 'map table view', path: '/atlas', prepare: async page => { await page.getByRole('button', { name: 'Table view' }).click(); await page.getByRole('table', { name: /Test rows/ }).waitFor(); } },
  { name: 'custom habitat with box handles', path: '/atlas?h=custom&o2=30&kpa=70.3' },
  { name: 'atlas tour', path: '/atlas', coach: true, prepare: async page => { await page.keyboard.press('?'); await page.getByRole('button', { name: /Replay the atlas tour/ }).click(); await page.getByRole('dialog', { name: 'Atlas tour' }).waitFor(); } },
  { name: 'atlas on a phone', path: '/atlas', viewport: { width: 375, height: 812 } },
  { name: 'landing on a phone', path: '/', viewport: { width: 375, height: 812 } },
  { name: 'briefing on a phone', path: '/briefing', viewport: { width: 375, height: 812 } },
];
for (const theme of THEMES) {
  for (const state of STATES) {
    test(`axe: ${state.name} in ${theme}`, async ({ page }) => {
      if (state.viewport) await page.setViewportSize(state.viewport);
      await page.addInitScript(([t, coach]) => { try { localStorage.setItem('fa.theme', t!); if (coach === '1') localStorage.setItem('fa.coach.seen', JSON.stringify({ atlas: true })); } catch { /* storage blocked */ } }, [theme, '1']);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(state.path);
      if (state.path.startsWith('/atlas')) await page.waitForSelector('.gapmap-chart svg[data-plot], .gapmap-table, .fa-skel', { timeout: 15000 });
      await state.prepare?.(page);
      await page.waitForTimeout(700);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      console.log(`AXE ${theme} [${state.name}]: serious/critical ${bad.reduce((n, v) => n + v.nodes.length, 0)} nodes in ${bad.length} rules; other ${result.violations.length - bad.length} rules`);
      expect(bad.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => `${n.target.join(' ')} :: ${(n.any[0] ?? n.all[0] ?? n.none[0])?.message ?? n.failureSummary}`) }))).toEqual([]);
    });
  }
}
