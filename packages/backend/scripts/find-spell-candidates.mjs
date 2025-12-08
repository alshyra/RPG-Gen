/* eslint-env node */
/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';

// Simple Levenshtein distance implementation
const lev = (a, b) => {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

const normalize = s => s.toString().normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();

const base = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const spellsPath = path.join(base, 'src', 'seed', 'spells.json');
const className = process.argv[2] || 'bard';
const fullPath = path.join(base, 'src', 'seed', 'classes', `${className}.allowed-spells.full.json`);

if (!fs.existsSync(fullPath)) {
  console.error('Missing file', fullPath);
  process.exit(2);
}

const spells = JSON.parse(fs.readFileSync(spellsPath, 'utf8'));
const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

// flatten spells into {id,name,norm}
const candidates = spells.map(s => ({ id: s.definitionId, name: s.name, norm: normalize(s.name) }));

const args = process.argv.slice(2);
const minScoreArgIndex = args.findIndex(a => a === '--min-score');
let minScore = 0.82;
if (minScoreArgIndex >= 0 && args[minScoreArgIndex + 1]) {
  minScore = Number(args[minScoreArgIndex + 1]) || minScore;
}

const emitReview = args.includes('--emit-review');

const out = {};

for (const [lvl, arr] of Object.entries(full.allowedSpellsByLevel || {})) {
  out[lvl] = [];
  for (const item of arr) {
    const name = typeof item === 'string' ? item : item.name;
    const norm = normalize(name.replace(/\s+\d+$/, '').trim());
    // compute candidate scores by Levenshtein ratio
    const scored = candidates.map((c) => {
      const d = lev(norm, c.norm);
      const max = Math.max(norm.length, c.norm.length) || 1;
      const score = 1 - d / max;
      return { id: c.id, name: c.name, score };
    }).sort((a, b) => b.score - a.score).slice(0, 6);

    out[lvl].push({ name, candidates: scored });
  }
}

const outPath = path.join(base, 'src', 'seed', 'classes', `${className}.allowed-spells.candidates.json`);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('wrote', outPath);

// optionally auto-apply high-confidence matches (score >= 0.82)
const autoApply = process.argv.includes('--apply');
if (autoApply) {
  const levelsPath = path.join(base, 'src', 'seed', 'classes', `${className}.levels.json`);
  if (!fs.existsSync(levelsPath)) {
    console.error('Missing class levels file', levelsPath);
    process.exit(2);
  }
  const levels = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
  const allowed = levels.allowedSpellsByLevel || {};
  for (const [lvl, arr] of Object.entries(out)) {
    if (!allowed[lvl]) continue;
    for (let i = 0; i < arr.length; i++) {
      const entry = arr[i];
      const best = entry.candidates[0];
      if (best && best.score >= 0.82) {
        // find the corresponding allowed item in levels and set definitionId
        const existing = allowed[lvl][i];
        if (typeof existing === 'string') {
          // replace string id -> object
          allowed[lvl][i] = { name: entry.name, definitionId: best.id };
        } else if (existing && existing.definitionId == null) {
          existing.definitionId = best.id;
        }
      }
    }
  }
  levels.allowedSpellsByLevel = allowed;
  fs.writeFileSync(levelsPath, JSON.stringify(levels, null, 2));
  console.log('applied high-confidence matches to', levelsPath);
}

// produce a review file containing only entries whose best candidate score is below minScore
if (emitReview) {
  const review = {};
  for (const [lvl, arr] of Object.entries(out)) {
    review[lvl] = [];
    for (const item of arr) {
      const best = item.candidates[0];
      if (!best || best.score < minScore) {
        // keep top 3 candidates to help manual decision
        review[lvl].push({ name: item.name, candidates: item.candidates.slice(0, 3) });
      }
    }
    if (review[lvl].length === 0) delete review[lvl];
  }
  const reviewPath = path.join(base, 'src', 'seed', 'classes', `${className}.allowed-spells.review.json`);
  fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2));
  console.log('wrote review file', reviewPath, ' (minScore=' + minScore + ')');
}
