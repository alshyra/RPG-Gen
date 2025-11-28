#!/usr/bin/env node
// Simple image optimizer for enemy portraits.
// Usage: node scripts/optimize-enemy-portraits.mjs <source-file> [--out ./packages/frontend/public/images/enemies]
// Requires `sharp` to be installed (it's included in backend deps). If sharp is not available, this script will copy the file.

import { promises as fs } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/optimize-enemy-portraits.mjs <source-file> [--out <outDir>]');
  process.exit(1);
}

const src = args[0];
let outDir = './packages/frontend/public/images/enemies';
const outFlagIndex = args.indexOf('--out');
if (outFlagIndex >= 0 && args[outFlagIndex + 1]) outDir = args[outFlagIndex + 1];

await fs.mkdir(outDir, { recursive: true });

try {
  const sharp = (await import('sharp')).default;
  const parsed = path.parse(src);
  const base = parsed.name;
  const outPng = path.join(outDir, `${base}.png`);
  const outWebp = path.join(outDir, `${base}.webp`);

  console.log('Optimizing image with sharp:', src);
  await sharp(src).resize(256, 256, { fit: 'cover' }).png({ quality: 80 }).toFile(outPng);
  await sharp(src).resize(256, 256, { fit: 'cover' }).webp({ quality: 75 }).toFile(outWebp);

  console.log('Wrote:', outPng, outWebp);
} catch (e) {
  // fallback: just copy file to out dir
  const parsed = path.parse(src);
  const outPng = path.join(outDir, parsed.base);
  console.warn('sharp not available or failed — copying file instead to:', outPng);
  await fs.copyFile(src, outPng);
}

console.log('Done. Place optimized files in your frontend public folder (they are already there if script ran).');
