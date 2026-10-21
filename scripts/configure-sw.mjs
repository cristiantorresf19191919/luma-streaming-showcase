import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Netlify adds HTML markup at the edge after the build (badge and hosting comment).
// Keep index.html in the versioned prefetch cache, but let the worker cache the
// actual HTTPS response instead of comparing it with the pre-transform HTML.
// Every JS/CSS/font/image hash remains intact; no private API responses are cached.
const path = 'dist/luma/browser/ngsw.json';
if (existsSync(path)) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  delete manifest.hashTable[manifest.index];
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
}
