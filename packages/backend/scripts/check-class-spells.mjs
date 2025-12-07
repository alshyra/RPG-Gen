import fs from 'fs';
import path from 'path';

const className = process.argv[2] || 'bard';
const base = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const spellsPath = path.join(base, 'src', 'seed', 'spells.json');
const classPath = path.join(base, 'src', 'seed', 'classes', `${className}.levels.json`);

if (!fs.existsSync(classPath)) {
  console.error(`Class file not found: ${classPath}`);
  process.exit(2);
}

const spells = JSON.parse(fs.readFileSync(spellsPath, 'utf8'));
const cls = JSON.parse(fs.readFileSync(classPath, 'utf8'));

const allDefs = new Set(spells.map(s => s.definitionId));
const report = {};
const allowed = cls.allowedSpellsByLevel || {};

for (const lvl of Object.keys(allowed)) {
  const arr = allowed[lvl];
  report[lvl] = { total: arr.length, present: 0, missing: [] };
  for (const item of arr) {
    // support either plain ids or objects {name, definitionId}
    const id = typeof item === 'string' ? item : (item && item.definitionId) || null;
    if (!id) report[lvl].missing.push(item);
    else if (allDefs.has(id)) report[lvl].present += 1;
    else report[lvl].missing.push(id);
  }
}

console.log(`${className} allowed spells check:`);
for (const lvl of Object.keys(report).sort((a,b)=>Number(a)-Number(b))) {
  const r = report[lvl];
  console.log(`level ${lvl}: ${r.present}/${r.total} found, ${r.missing.length} missing`);
}

const missingAll = Object.values(report).flatMap(r => r.missing);
if (missingAll.length > 0) {
  console.log('\nMissing definitionIds or entries (they may be absent from spells.json):');
  missingAll.forEach(x => console.log(' - ' + (typeof x === 'object' ? JSON.stringify(x) : x)));
} else {
  console.log('\nAll mapped definitionIds exist in spells.json');
}
