// Module resolve hook for the tests: "@/x" -> src/x, and imports without an extension -> the .ts / .tsx file.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = new URL('../src/', import.meta.url);

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith('@/')) spec = new URL(spec.slice(2), SRC).href;
  const isPath = spec.startsWith('file:') || spec.startsWith('./') || spec.startsWith('../');
  if (isPath && !/\.[cm]?[jt]sx?$/.test(spec)) {
    const base = new URL(spec, context.parentURL);
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      const file = fileURLToPath(base) + ext;
      if (existsSync(file)) return next(pathToFileURL(file).href, context);
    }
  }
  return next(spec, context);
}
