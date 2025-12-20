#!/usr/bin/env node

/**
 * Validation script for seed data coherence
 * Checks that all aptitudeIds referenced in voies.json exist in aptitudes.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '../apps/backend/src/seed');

// Load aptitudes
const aptitudesPath = path.join(seedDir, 'aptitudes.json');
const aptitudesData = JSON.parse(fs.readFileSync(aptitudesPath, 'utf8'));
const aptitudeIds = new Set(aptitudesData.map(a => a.id));

console.log(`✓ Loaded ${aptitudeIds.size} aptitudes`);

// Collect all referenced aptitudeIds from voies.json files
const allReferencedIds = new Set();
const classesDir = path.join(seedDir, 'classes');

const classes = fs.readdirSync(classesDir);
for (const className of classes) {
  const voiesPath = path.join(classesDir, className, 'voies.json');
  if (fs.existsSync(voiesPath)) {
    const voiesData = JSON.parse(fs.readFileSync(voiesPath, 'utf8'));
    for (const voieId in voiesData.voies) {
      const voie = voiesData.voies[voieId];
      for (const rank of voie.ranks) {
        allReferencedIds.add(rank.aptitudeId);
      }
    }
  }
}

console.log(`✓ Found ${allReferencedIds.size} unique aptitudeIds referenced in voies`);

// Check for missing aptitudes
const missing = [];
for (const id of allReferencedIds) {
  if (!aptitudeIds.has(id)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error(`✗ Found ${missing.length} missing aptitudes:`);
  for (const id of missing) {
    console.error(`  - ${id}`);
  }
  process.exit(1);
} else {
  console.log(`✓ All referenced aptitudeIds exist in aptitudes.json`);
}

console.log('\n✓ Seed data is coherent!');
