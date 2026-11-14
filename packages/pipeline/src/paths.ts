import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '../../..');
}

export function samplesDir(root = repoRoot()): string {
  return resolve(root, 'research/flame/samples');
}

export function psiTablesDir(root = repoRoot()): string {
  return resolve(samplesDir(root), 'psi_tables');
}

export function psiJsonDir(root = repoRoot()): string {
  return resolve(samplesDir(root), 'psi_json');
}
