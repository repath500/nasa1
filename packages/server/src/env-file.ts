/**
 * Minimal .env.local reader. Values are never logged. Existing process env
 * values win, so a shell export overrides the file.
 */
export const parseEnvFile = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const withoutExport = line.startsWith('export ') ? line.slice(7).trim() : line;
    const equals = withoutExport.indexOf('=');
    if (equals <= 0) continue;
    const key = withoutExport.slice(0, equals).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = withoutExport.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

export const loadEnvFile = async (path: string): Promise<string[]> => {
  try {
    const { readFile } = await import('node:fs/promises');
    const text = await readFile(path, 'utf8');
    const values = parseEnvFile(text);
    const applied: string[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        applied.push(key);
      }
    }
    return applied;
  } catch {
    return [];
  }
};
