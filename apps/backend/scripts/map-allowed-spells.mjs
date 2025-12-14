/* eslint-env node */
/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';

const base = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const seedPath = path.join(base, 'src', 'seed', 'spells.json');
const className = process.argv[2] || 'bard';
const mdPath = path.join(base, 'src', 'seed', 'classes', className, 'allowed-spells.md');

const spells = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
if (!fs.existsSync(mdPath)) {
  console.error('Missing MD list for class', className, mdPath);
  process.exit(2);
}
const md = fs.readFileSync(mdPath, 'utf8');

const normalize = s => s.toString().normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();

const lines = md.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const mapping = {};
const notfound = [];
for (const line of lines) {
  // accept either tab-separated columns or a trailing level number ("Name 1")
  const tabParts = line.split(/\t+/).map(p => p.trim()).filter(Boolean);
  let name;
  let lvl;
  if (tabParts.length > 1) {
    name = tabParts[0];
    lvl = tabParts[1];
  } else {
    // try capture trailing number
    const m = line.match(/^(.*\S)\s+(\d+)\s*$/);
    if (m) {
      name = m[1].trim();
      lvl = m[2];
    } else {
      name = line;
      lvl = '0';
    }
  }
  if (!mapping[lvl]) mapping[lvl] = [];
  const norm = normalize(name);
  const found = spells.find(s => normalize(s.name) === norm);
  if (found) mapping[lvl].push(found.definitionId);
  else notfound.push({ name, lvl, norm });
}

console.log('Mapping result (level -> count):');
Object.keys(mapping).sort((a, b) => Number(a) - Number(b)).forEach(k => console.log(k, mapping[k].length));
if (notfound.length) {
  console.error('NOT FOUND ENTRIES', notfound);
}

// write output (default: write only full mapping with name+id)
const emitMapped = process.argv.includes('--emit-mapped');
const emitResolved = process.argv.includes('--emit-resolved');

// NOTE: we previously built an "outFull" and wrote to the full filename here.
// The script now produces a final (more faithful) `full` mapping below which
// preserves the original names from the MD file and attaches `definitionId`
// when found. To avoid duplicate declarations and accidental overwrites,
// prefer the final `full` block (see below) and skip writing an earlier copy.

if (emitMapped) {
  const out = { allowedSpellsByLevel: mapping };
  const outPath = path.join(base, 'src', 'seed', 'classes', className, 'allowed-spells.mapped.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('\nwrote ' + outPath);
}

// produce a resolved mapping (name + definitionId if found) and write it
if (emitResolved) {
  const resolved = {};
  for (const [lvl, arr] of Object.entries(mapping)) {
    resolved[lvl] = arr.map((id) => {
      const def = spells.find(s => s.definitionId === id) || null;
      if (def) return { name: def.name, definitionId: def.definitionId };
      const parts = id.split('-').slice(2).join(' ').replace(/-/g, ' ');
      return { name: parts, definitionId: null };
    });
  }
  const resolvedOut = path.join(base, 'src', 'seed', 'classes', className, 'allowed-spells.resolved.json');
  fs.writeFileSync(resolvedOut, JSON.stringify({ allowedSpellsByLevel: resolved }, null, 2));
  console.log('\nwrote ' + resolvedOut);
}

// produce full mapping: keep every name from the MD with definitionId if available (or null)
const full = {};
for (const rawLine of lines) {
  // same parsing used above: accept tabs or trailing numeric level
  const tabParts = rawLine.split(/\t+/).map(p => p.trim()).filter(Boolean);
  let name;
  let lvl;
  if (tabParts.length > 1) {
    name = tabParts[0];
    lvl = tabParts[1];
  } else {
    const m = rawLine.match(/^(.*\S)\s+(\d+)\s*$/);
    if (m) {
      name = m[1].trim();
      lvl = m[2];
    } else {
      name = rawLine;
      lvl = '0';
    }
  }
  if (!full[lvl]) full[lvl] = [];
  const norm = normalize(name);
  const found = spells.find(s => normalize(s.name) === norm) || null;
  full[lvl].push({ name, definitionId: found ? found.definitionId : null });
}
const fullOut = path.join(base, 'src', 'seed', 'classes', className, 'allowed-spells.full.json');
fs.writeFileSync(fullOut, JSON.stringify({ allowedSpellsByLevel: full }, null, 2));
console.log('\nwrote ' + fullOut);
