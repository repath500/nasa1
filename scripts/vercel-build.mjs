// Builds Fire Atlas into Vercel's prebuilt output (.vercel/output): static site + one Node.js function for /api/*.
// Usage: node scripts/vercel-build.mjs   then   vercel deploy --prebuilt --prod
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.vercel/output');
const require = createRequire(join(root, 'apps/web/package.json'));
const esbuild = await import(require.resolve('esbuild', { paths: [dirname(require.resolve('vite'))] }));

execSync('pnpm build', { cwd: root, stdio: 'inherit' });
rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'apps/web/dist'), join(out, 'static'), { recursive: true });

const fn = join(out, 'functions/api.func');
mkdirSync(fn, { recursive: true });
await esbuild.build({
  entryPoints: [join(root, 'packages/server/vercel/handler.ts')],
  outfile: join(fn, 'index.mjs'),
  bundle: true, platform: 'node', format: 'esm', target: 'node20', logLevel: 'warning',
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
writeFileSync(join(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 30 }, null, 2));
writeFileSync(join(out, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '^/api(?:/.*)?$', dest: '/api' },
    { handle: 'filesystem' },
    { src: '^/(.*)$', dest: '/index.html' },
  ],
}, null, 2));
console.log('vercel output ready:', out);
