import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** SPEC 6.3 and OV-1 B10: data marks need 3:1 against the map background in every theme (WCAG 1.4.11), not just in Night. */
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const block = (selector: string): Record<string, string> => {
  const start = css.indexOf(selector); const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1]!, m[2]!]));
};
const themes: Record<string, Record<string, string>> = {
  night: block(':root, :root[data-theme="night"]'), paper: { ...block(':root, :root[data-theme="night"]'), ...block(':root[data-theme="paper"]') }, contrast: { ...block(':root, :root[data-theme="night"]'), ...block(':root[data-theme="contrast"]') },
};
const lum = (hex: string) => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; };
export const contrast = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi! + 0.05) / (lo! + 0.05); };
const MARKS = ['--color-droplet', '--color-solid', '--color-gas', '--color-aerosol', '--color-burner', '--color-unknown'];

describe('data palette contrast against the map background', () => {
  for (const [name, tokens] of Object.entries(themes)) {
    // The map sits on the page background in the atlas and on the surface colour inside the map card, so both must hold.
    for (const background of ['--color-bg', '--color-surface']) {
      it(`${name}: every mark has at least 3:1 on ${background}`, () => {
        const rows = MARKS.map(m => ({ m, ratio: contrast(tokens[m]!, tokens[background]!) }));
        console.log(`CONTRAST ${name} on ${background} ${tokens[background]}: ` + rows.map(r => `${r.m.replace('--color-', '')} ${tokens[r.m]} ${r.ratio.toFixed(2)}`).join(' | '));
        for (const r of rows) expect(r.ratio, `${r.m} in ${name}`).toBeGreaterThanOrEqual(3);
      });
    }
  }
  it('the habitat box accent and selection ring also clear 3:1 in every theme', () => {
    for (const [name, tokens] of Object.entries(themes)) for (const t of ['--color-accent', '--color-focus']) expect(contrast(tokens[t]!, tokens['--color-surface']!), `${t} in ${name}`).toBeGreaterThanOrEqual(3);
  });
});
