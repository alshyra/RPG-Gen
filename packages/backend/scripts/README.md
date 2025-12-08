Scripts for mapping class allowed-spells -> canonical spell ids

Usage (from repository root):

- Map allowed spells (markdown) to canonical ids and write the canonical `full.json` by default:
  node packages/backend/scripts/map-allowed-spells.mjs <class>

  Optional flags:
  --emit-mapped -> also write the compact `*.allowed-spells.mapped.json` (arrays of ids)
  --emit-resolved -> also write the resolved `*.allowed-spells.resolved.json` (name+id fallback)

- Find fuzzy candidates for unresolved names (create `*.allowed-spells.candidates.json`):
  node packages/backend/scripts/find-spell-candidates.mjs <class>

  Optional flags:
  --apply -> attempt to auto-apply high-confidence matches (score >= 0.82) into <class>.levels.json
  --min-score <num> -> change threshold for --apply and --emit-review (default: 0.82)
  --emit-review -> produce <class>.allowed-spells.review.json containing only low-confidence entries (for manual review)

- Verify class-level seeds for missing definitionIds:
  node packages/backend/scripts/check-class-spells.mjs <class>

Notes:

- The pipeline is intentionally conservative: the scripts will not auto-apply uncertain matches unless explicitly asked. Use `--emit-review` to create a short list of items requiring manual resolution.
