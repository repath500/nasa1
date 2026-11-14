import { chromium } from '@playwright/test';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => console.log('console', m.type(), m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 400)));
await p.goto('http://127.0.0.1:5199/atlas'); await p.waitForTimeout(2500);
await p.screenshot({ path: '/private/tmp/claude-501/-Users-repathkhan--t3-worktrees-nasa1-t3-6ab9b3bf-d999b614f8ca04dc/821f017a-4a3b-47ed-a9c1-e22279a94b9c/scratchpad/atlas.png' });
console.log((await p.locator('body').innerText()).slice(0, 600));
await b.close();
