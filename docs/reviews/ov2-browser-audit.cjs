const { createRequire } = require('node:module');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const localRequire = createRequire(path.join(root, 'apps/web/package.json'));
const { chromium } = localRequire('@playwright/test');
const origin = process.env.OV2_ORIGIN || 'http://127.0.0.1:5182';
const screenshots = path.join(__dirname, 'ov2-shots');
const observations = [];

async function run() {
  await fs.mkdir(screenshots, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PW_CHROMIUM_PATH || path.join(process.env.HOME, 'Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.on('pageerror', error => observations.push({ error: error.message, url: page.url() }));
  const snapshot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(screenshots, `${name}.png`), fullPage: true, timeout: 15000 });
    observations.push({ name, url: page.url(), text: await page.locator('body').innerText() });
  };
  await page.goto(origin);
  await page.getByRole('button', { name: 'Start briefing', exact: true }).waitFor();
  await snapshot('01-landing');
  await page.getByRole('button', { name: 'Start briefing', exact: true }).click();
  await snapshot('02-briefing-habitat');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await snapshot('03-briefing-concern');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await snapshot('04-briefing-fuel');
  await page.getByRole('button', { name: 'See my briefing', exact: true }).click();
  await snapshot('05-briefing-summary');
  await page.getByRole('button', { name: 'Open the atlas', exact: true }).click();
  await page.getByRole('tab', { name: /Studies/ }).waitFor();
  const skip = page.getByRole('button', { name: 'Skip', exact: true });
  if (await skip.isVisible()) await skip.click();
  await snapshot('06-atlas');
  const corpus = JSON.parse(await fs.readFile(path.join(root, 'data/corpus.v1.json'), 'utf8'));
  const midpoint = range => range.min === null ? range.max : range.max === null ? range.min : (range.min + range.max) / 2;
  const row = corpus.rows.find(item => item.id === 'PSI-69:24');
  const maximumPressure = Math.max(150, 70.3 * 1.5, ...corpus.rows.map(item => midpoint(item.pressureKpa) || 0));
  const maximumOxygen = Math.max(45, 40, ...corpus.rows.map(item => midpoint(item.o2Pct) || 0));
  const bounds = await page.getByRole('application').boundingBox();
  const pointX = 115 + Math.log(row.pressureKpa.min) / Math.log(maximumPressure * 1.1) * 750;
  const pointY = 410 - row.o2Pct.min / Math.min(110, maximumOxygen * 1.1) * 375;
  await page.mouse.click(bounds.x + bounds.width * pointX / 900, bounds.y + bounds.height * pointY / 500);
  await page.getByRole('button', { name: 'Close evidence (Esc)', exact: true }).waitFor();
  await snapshot('07-mark-click');
  await page.getByRole('link', { name: 'Open study', exact: true }).click();
  await page.getByRole('button', { name: 'Close evidence (Esc)', exact: true }).click();
  await page.getByRole('heading', { name: /Flame Extinguishment/ }).waitFor();
  await snapshot('08-study-flex');
  await page.locator('#cmp-other').selectOption('PSI-25');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await page.getByRole('heading', { name: 'FLEX and BASS-II', exact: true }).waitFor();
  await snapshot('09-compare');
  await page.getByRole('link', { name: 'Atlas', exact: true }).click();
  await page.getByRole('link', { name: 'Export brief', exact: true }).click();
  await page.getByText('SCENARIO AND SOURCES', { exact: true }).waitFor();
  await snapshot('10-gap-brief');
  await page.getByRole('link', { name: 'About', exact: true }).first().click();
  await page.getByRole('heading', { name: 'About Fire Atlas', exact: true }).waitFor();
  await snapshot('11-about');
  await page.getByRole('link', { name: 'Credits', exact: true }).last().click();
  await page.getByRole('heading', { name: 'Credits and disclosure', exact: true }).waitFor();
  await snapshot('12-credits');
  await page.getByRole('link', { name: 'Atlas', exact: true }).click();
  await page.getByRole('button', { name: 'Listen mode', exact: true }).click();
  await page.getByRole('button', { name: 'Open transcript', exact: true }).waitFor();
  await snapshot('13-listen');
  await page.getByRole('button', { name: 'Open transcript', exact: true }).click();
  await snapshot('14-transcript');
  observations.push({ name: 'device-speech', state: await page.evaluate(() => ({ speaking: speechSynthesis.speaking, pending: speechSynthesis.pending, voices: speechSynthesis.getVoices().length })) });
  await page.goto(`${origin}/atlas`);
  await page.getByRole('button', { name: 'Open command palette', exact: true }).click();
  await page.locator('[cmdk-input]').fill('Which solid tests near 30% oxygen at 70 kPa?');
  await snapshot('15-ask-empty');
  observations.push({ name: 'ask-visible', visible: await page.getByTestId('palette-ask').isVisible() });
  await page.getByTestId('palette-ask').evaluate(element => element.click());
  await page.getByRole('button', { name: 'Apply in atlas', exact: true }).waitFor();
  await snapshot('16-ask-diagnostic-fallback');
  await page.getByRole('button', { name: 'Apply in atlas', exact: true }).click();
  await page.getByRole('link', { name: 'Pricing', exact: true }).first().click();
  await page.getByText('Billing not configured.', { exact: true }).first().waitFor();
  await snapshot('17-pricing');
  observations.push({ name: 'billing-disabled', researcher: await page.getByRole('button', { name: 'Start Researcher', exact: true }).isDisabled(), lab: await page.getByRole('button', { name: 'Start Lab', exact: true }).isDisabled() });
  await page.getByRole('link', { name: 'Learn', exact: true }).first().click();
  await page.getByRole('slider').waitFor();
  await snapshot('18-learn');
  await page.getByRole('slider').focus();
  await page.keyboard.press('Home');
  for (let step = 0; step < 20; step++) await page.keyboard.press('ArrowRight');
  await snapshot('19-learn-oxygen-30');
  await page.goto(`${origin}/present`);
  const titles = ['Title', 'The problem', 'Gap Map reveal', 'Two rankers', 'Evidence and Caught by code', 'How the AI is used and tested', 'Limits and team'];
  for (let index = 0; index < titles.length; index++) {
    if (index > 0) await page.keyboard.press('ArrowRight');
    try {
      await page.getByTestId('present').filter({ hasText: `${index + 1} / 7` }).waitFor({ timeout: 3500 });
    } catch {
      observations.push({ name: 'present-did-not-settle', expected: titles[index], actual: await page.getByTestId('present').getAttribute('aria-label').catch(() => null) });
    }
    await snapshot(`22-present-settled-${index + 1}`);
  }
  await page.goto(`${origin}/duel?h1=earth-iss&h2=lunar-cabin-example`);
  await page.getByRole('heading', { name: 'Compare atmospheres', exact: true }).waitFor();
  await snapshot('21-duel');
  await fs.writeFile('/tmp/fire-atlas-ov2/browser.json', JSON.stringify(observations, null, 2));
  await browser.close();
}

run().catch(error => { console.error(error); process.exitCode = 1; });
