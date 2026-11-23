#!/usr/bin/env node
// Downloads the official source PDFs into /sources if they're missing.
//   npm run fetch:sources          (add -- --force to re-download)
// NCARB's Guidelines PDF is not committed (copyrighted; public repo), so run this after cloning.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const force = process.argv.includes('--force');
const FILES = [
  ['sources/are/ARE-5-Guidelines.pdf', 'https://www.ncarb.org/sites/default/files/ARE-5-Guidelines.pdf'],
  ['sources/cse/architects-practice-act.pdf', 'https://www.cab.ca.gov/docs/publications/architects-practice-act.pdf'],
  ['sources/cse/coastal-act.pdf', 'https://www.coastal.ca.gov/coastact.pdf'],
];

let failed = 0;
for (const [rel, url] of FILES) {
  const dest = join(ROOT, rel);
  if (existsSync(dest) && !force) {
    console.log(`✓ ${rel} (already present)`);
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error('response is not a PDF (site may have blocked the request)');
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`↓ ${rel} (${(buf.length / 1e6).toFixed(1)} MB)`);
  } catch (e) {
    failed++;
    console.error(`✗ ${rel}: ${e.message}\n  Download it in a browser from ${url} and save it at ${rel}`);
  }
}
console.log('\nThe CSE Handbook must be added by hand: see sources/README.md.');
process.exit(failed ? 1 : 0);
