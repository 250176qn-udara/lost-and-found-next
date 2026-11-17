// Loaded with `node --import ./tests/setup.mjs --test` (see "test" in package.json).
// Node 24 runs TypeScript itself; this only teaches it the app's import style ("@/lib/x" and "./x" without ".ts").
import { register } from 'node:module';

register('./resolve.mjs', import.meta.url);
