import { buildPages } from './pages.ts';
import { repoRoot } from './paths.ts';

const documents = buildPages(repoRoot());
console.log(`Built ${documents.length} local NTRS text documents.`);
