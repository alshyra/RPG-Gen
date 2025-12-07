# API design: class-level options (extracted from /levelup)

This document describes the planned API changes to extract _class-level rules by level_ out of the character-level endpoints and make them available independently.

## Why

- Requesting the set of rules/options unlocked by a class at a given level does not need an existing character. The frontend should be able to ask "what are the rules/options for Bard level 1?" without creating a draft character first.
- This reduces coupling between UI and character state, allows reuse of the same logic for character creation and later level-ups, and makes the API clearer and easier to test.

## Goals

- Add a public endpoint to fetch class-level options for a given level (no character id required).
- Ensure returned options contain canonical references (`definitionId`) for spells so frontends can persist selections reliably.
- Keep server-side validation for applying level-up choices (character context still required for persistence and validation).

## API changes — summary

1. NEW endpoint (recommended)

GET /api/classes/{className}/levels/{level}

- Purpose: Return the class-level options for `className` at `level` (e.g., unlocked spells, special features, whether ASI/proficiency increase is expected for this level).
- Authorization: public or guarded depending on product policy — the endpoint can be public (no user/character required) because it only returns rules.
- Response shape: Level definition similar to `LevelUpOptionsDto` but explicitly independent of a character. Example:

  {
  "className": "bard",
  "level": 1,
  "unlockedSpells": [
  { "definitionId": "spell.fireball", "name": "Fireball", "level": 3, "description": "...", "meta": {...} },
  ...
  ],
  "asiAvailable": false,
  "proficiencyIncrease": false,
  "otherFeatures": []
  }

2. KEEP / MODIFY existing character-level endpoints

- Keep POST /api/characters/{characterId}/levelup/{className} — this endpoint must continue to exist. It requires character context (user, characterId) to persist the choices and apply their effects (increment level, add spells, apply ASI, etc.).
- REMOVE: GET /api/characters/{characterId}/levelup/{className} will be removed from the codebase. Clients MUST use the new class-level endpoint for rule discovery — there will be no transitional compatibility layer.

3. DTO / contract changes

- `LevelUpOptionsDto` (or the new independent response type) must include `definitionId` for each unlocked spell. Example `unlockedSpells` item should contain: { definitionId: string, name: string, level: number, description?: string, meta?: object }.
- `LevelUpApplyDto` should prefer an array of `definitionId` values in `addSpells` (string[]). Backward compatibility: server will still accept spell names for a transitional period, but new client code MUST use `definitionId`.
- Update shared OpenAPI / `packages/shared` so generated client types reflect `definitionId` in unlocked spells and the LevelUpApplyDto `addSpells` intention.

4. Migration path (no backward compatibility)

- Implement the new GET /api/classes/... endpoint and update frontend flows to use it.
- Immediately remove GET /api/characters/{characterId}/levelup/{className} and update any internal references to point at the new endpoint/helper. There will be no backwards-compatibility shim retained.
- Update client code and tests (frontend + E2E) so they rely on the new route.

5. Backend validation & persistence

- `applyLevelUp` must accept `addSpells` as an array of `definitionId` and validate each id with the SpellDefinitionService (findByDefinitionId). The server already accepts either id or name; we will keep this but prefer definitionId. When adding spells to the character's `spells` list, the server should add a `SpellResponseDto` with `name` (resolved from the definition), `description` and `meta` (so persisted data is user-friendly and canonical).

6. Tests and seeds

- Ensure seeds for spell definitions include deterministic `definitionId` values (e.g. `spell.main-de-mage` etc.). Tests and E2E will assert on these definitionIds, not on localized names.
- Add unit tests for the new class-level endpoint (happy path + invalid level / unknown class).
- Add tests for `applyLevelUp` accepting definitionIds and persisting resolved names/meta.

## Implementation notes / incremental approach

- Step A: Implement the new endpoint and update DTOs + shared OpenAPI. Make unlockedSpells include `definitionId`.
- Step B: Modify the frontend to use the new endpoint for rules discovery during character creation (create draft character first to obtain a characterId if necessary to persist later, or allow rule discovery without creating character at all).
- Step C: Update `LevelUpApplyDto` handling to use definitionIds (update server behavior to resolve names on persist). Add tests and update client call sites.
- Step D: Migrate E2E tests to assert on definitionId values and persisted spell names in character records.
- Step E: After rollout, remove deprecated GET /api/characters/{characterId}/levelup/{className}.

## Frontend roadmap / client changes (explicit)

The backend changes require a clear, small set of changes on the frontend. We will prefer a gradual atomic migration but without retaining server-side compatibility for the old route.

- New client module: `packages/frontend/src/apis/classesApi.ts`

  - Purpose: call GET /api/classes/{className}/levels/{level} and return a `LevelUpOptionsDto` (which now includes `definitionId` on unlockedSpells).
  - This file should be the new canonical place for class-level rules discovery.

- Delete `levelUpApi` but remove its `getOptions` method:

  - `packages/frontend/src/apis/levelUpApi.ts` will keep `applyLevelUp(characterId, className, payload)` which maps to POST /api/characters/{characterId}/levelup/{className} (persist action).
  - Old `getOptions(characterId, className)` calls (if any) must be replaced by calls to `classesApi.getLevelOptions(className, level)`.

- Creation flow (UI):

  - When creating a character, the frontend may still create a draft character via POST /api/characters to get a `characterId` so the final applyLevelUp step can persist cleanly.
  - To present rules during creation, call `classesApi.getLevelOptions(className, 1)` — no character id required.

- `dndRulesService` and `dndLevelUpService` (frontend services):

  - Status: These modules are currently implemented as local rule engines / helpers. Because we are moving to server-driven rules, decide which of the following to follow:
    - Refactor to thin clients that call backend endpoints (`classesApi` and server-level level-up helpers). This is recommended for production builds so UI reads authoritative data from server.
    - Keep small UI-only helpers for rendering and deterministic local behavior in dev/test modes only (guarded behind ENV or dev flag). These helpers should be explicitly marked deprecated and reduced in scope.
    - Remove entirely from production build once frontend has been migrated to backend-driven rules and tests use the backend endpoints.
  - NOTE: if there is an opportunity to delete duplicated logic (e.g., spell filtering, class-level rules) from these services because the backend is now authoritative, prefer deletion.

- Tests / E2E changes:

  - E2E must be updated to use `classesApi.getLevelOptions` and expect `definitionId` values returned by the server.
  - Update test fixture seeds to include deterministic `definitionId` values for the targeted classes and levels (Bard/Cleric initially).
  - E2E character creation flow should:
    1. Create draft character (POST /api/characters) to obtain `characterId` (if necessary)
    2. Fetch `classesApi.getLevelOptions('Bard', 1)` and assert the unlocked spells include the known `definitionId`s
    3. Pick `definitionId`s (e.g., the exact cantrips / level-1 spells) and call `levelUpApi.applyLevelUp(characterId, 'Bard', { addSpells: [<definitionId>, ...] })`
    4. Assert persistence and that the `character` returned contains SpellResponseDto entries with the resolved `name`, `description`, and `meta`.

  ## Specific Bard spell selections for E2E tests

  When writing explicit end-to-end tests for Bard level 1 creation, the frontend should select the following spells to ensure deterministic behavior and a single source of truth:

  cantrips (choose 2):

  - Main de mage
  - Message

  spells (choose up to 4 level-1 spells):

  - Mot de guérison
  - Soins
  - Murmures dissonants
  - Sommeil

  Tests should assert that:

  - The `classesApi.getLevelOptions('Bard', 1)` response contains these spells with `definitionId`s (seed fixtures should include those definitionIds).
  - After `levelUpApi.applyLevelUp` with the selected `definitionId`s, the returned/persisted character object contains SpellResponseDto entries with the resolved spell `name` matching the list above.

## Notes

- We intentionally remove the old `getOptions` usage and the character-level GET route. Frontend tests and code will be directly updated to call the new route and wire `definitionId` through the UI to the server.
- Because the DnD helper services contain duplicated logic, treat them as temporary conveniences. The long-term goal is single source of truth: the backend.
