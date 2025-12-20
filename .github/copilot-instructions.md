<!--
Short, focused instructions for AI coding agents working on this repository.
Keep changes small, explain impact, add tests and run CI locally when possible.
-->

# Copilot / AI contributor guide — RPG-Gen

Quick summary: This is a monorepo with two main packages: `packages/backend` (NestJS, MongoDB, Google Gemini) and `packages/frontend` (Vue 3, Vite, Tailwind). Shared DTOs live under `packages/shared` and are generated from backend schemas.

Core rules

- Always read the relevant code, tests and CI workflow before acting. Avoid taking irreversible actions without confirmation.
- Keep PRs atomic: one feature/fix per PR, include motivation, files touched and tests added/updated.
- No unnecessary comments: remove dead code, consolidate duplicates, and refactor into shared utilities.

- Controllers must remain strict and explicit about request shapes. Do NOT try to accept multiple payload shapes in a controller method (e.g. both `expr` and `dices`). Validation/normalization belongs to DTOs, pipes, middleware, or higher-level adapters (e.g. the Gemini adapter). Add tests that assert strict behavior.

- Avoid `any`: Do not use the `any` type in production code. Prefer concrete types, DTOs or interfaces from `packages/shared` (generated `ItemDto`, `CharacterDto`, etc.). In tests or quick prototypes you may use `any` if absolutely necessary.

- Avoid using `as` type casting. Let TypeScript infer types where possible, use proper types/interfaces instead of forcing types with `as`.

Strict rule: Do not use `as` casting in production code.

- Rationale: `as` (and patterns like `as unknown as Type`) bypass the TypeScript type system and hides real type mismatches, which can lead to runtime errors. The project does not allow wholesale use of `as`.
- Alternatives and preferred patterns:
  - Use non-null checks, inference, and immutable updates rather than casting. Example:
    ```ts
    if (!currentCharacter.value) return;
    currentCharacter.value = {
      ...currentCharacter.value,
      spells: [...(currentCharacter.value.spells || []), spell],
    };
    ```
  - Use a typed helper or small type-guard (type predicate) instead of `as`.
    ```ts
    // type guard example
    const ensureSpells = (c: CharacterDto): asserts c is CharacterDto & { spells: SpellDto[] } => {
      if (!c.spells) c.spells = [];
    };
    // usage
    if (!currentCharacter.value) return;
    ensureSpells(currentCharacter.value);
    currentCharacter.value.spells.push(spell);
    ```
  - Use immutability to update typed objects, as in the first example, rather than mutating casts.

- Special cases: If there is a compelling, unavoidable reason to use `as` (third-party untyped libs), open a short PR for discussion and request a reviewer to explicitly approve this temporary exception; do not leave in-code `as` usage unreviewed. Avoid documenting the exception via inline comments in code; track the exception in the PR description and remediate later.

- Development: start everything with Docker Compose (root):
  - docker compose -f compose.dev.yml up -d
  - frontend: http://localhost, backend: http://localhost/api/docs
- Workspace scripts (root):
  - npm run start:dev to run backend+frontend concurrently
  - npm test to run backend + frontend tests

Tests & CI

- Backend uses AVA (packages/backend). Run in package folder: npm run test
- Frontend uses Vitest + Cypress (packages/frontend): npm run test, npm run test:e2e
- CI enforces lint+type checks, unit tests, and E2E runs with docker-compose. See `.github/workflows/qa-checks.yml` for exact steps.

Patterns & conventions to respect

- **DTO validation pattern**: DTOs own validation, services do not. Every DTO must provide a constructor that validates required fields and throws descriptive errors on missing/invalid data. Services should instantiate DTOs and trust constructor validation—do not add validation logic to service methods. Example:
  ```ts
  // DTO constructor validates
  export class AptitudeResponseDto {
    constructor(init?: Partial<AptitudeResponseDto>) {
      if (!init?.aptitudeId) throw new Error("AptitudeResponseDto: missing required field 'aptitudeId'");
      if (!init?.name) throw new Error("AptitudeResponseDto: missing required field 'name'");
      // ... validate other required fields
      Object.assign(this, init);
    }
  }
  // Service simply passes data and relies on constructor
  toResponseDto(aptitude: Partial<Aptitude>): AptitudeResponseDto {
    return new AptitudeResponseDto({...aptitude});
  }
  ```

- **Strict enum typing for DTO fields**: When a DTO property accepts only specific literal values (e.g., `className: 'guerrier' | 'rogue' | 'mage'`), the constructor must validate the input using type guards (type predicates). Never use `as` casting. Example:
  ```ts
  // Type guard (type predicate) - validates AND narrows type
  const isValidClassName = (value: unknown): value is 'guerrier' | 'rogue' | 'mage' => {
    return ['guerrier', 'rogue', 'mage'].includes(value as string);
  };

  export class CharacterResponseDto extends BaseCharacterResponseDto {
    constructor(init?: Partial<CharacterResponseDto> | CharacterDocument) {
      if (!init) throw new Error("...");
      // Validate enum values before use
      if (init.className && !isValidClassName(init.className)) {
        throw new InternalServerErrorException(`Invalid className: ${init.className}`);
      }
      if (init.raceId && !isValidRaceId(init.raceId)) {
        throw new InternalServerErrorException(`Invalid raceId: ${init.raceId}`);
      }
      super();
      // Type guard narrows type - no casting needed
      this.className = init.className && isValidClassName(init.className) ? init.className : undefined;
      this.raceId = init.raceId && isValidRaceId(init.raceId) ? init.raceId : undefined;
    }
  }
  ```

- **Always verify TypeScript compilation before generating OpenAPI types**: Run `npm run type-check` in the backend folder before executing `npm run generate:openapi`. This ensures the backend compiles successfully and the OpenAPI spec accurately reflects your DTOs.

- DTO generation: backend schemas ➜ generator script at `packages/backend/src/scripts/generate-dtos.ts`. Do not hand-edit generated files in `packages/shared/src/generated`. If schema changes are needed run `npm --workspace @rpg-gen/backend run generate:dtos` and commit the result.
- Chat / Gemini integration: `packages/backend/src/external/text/gemini-text.service.ts` — robust extraction/parsing of Gemini responses is central. Tests often mock or avoid non-deterministic AI outputs — prefer making Gemini interactions injectable/mocked in tests.
- Narrative parsing conventions: game instructions are embedded as JSON in narrative text and parsed by `packages/backend/src/external/game-parser.util.ts`. Tests expect specific JSON extraction and cleaning behavior.

Security / Deployment

- Secrets & tokens are never checked in. CI and Cloud Run rely on GitHub Secrets (see `.github/workflows/build-and-deploy.yml`). FRONTEND_URL and GOOGLE keys must be set for OAuth and AI calls.

Where to look first

- `README.md` — project overview + dev flow
- `apps/backend/src` — main backend code and tests
- `apps/frontend/src` — frontend UI, Cypress tests
- `packages/shared/src` — generated DTOs and public API shapes
- `packages/ui` — shared Vue 3 components and styles
- `packages/api-client` — TypeScript API client for frontend-backend communication wrapped in vuequery
- `.github/workflows` — CI steps, test orchestration, node versions and docker compose usage

If unclear: ask 1–2 clarifying questions before making changes (for example: "Do you want an API-only change or end-to-end validation?" or "Should I add unit tests, or a small integration test using Docker Compose?").

Note: See `.github/agents/dev.agent.md` for our conversational/approval rules and PR checklists — follow them when proposing changes.


## Règles pour les tests E2E avec Playwright

## Principe fondamental
Un test E2E doit simuler le comportement d'un véritable utilisateur. 
L'utilisateur ne fait PAS d'appels API directs - il clique, tape, navigue.

### Quand utiliser `page.request` (API directe)

✅ **AUTORISÉ : Setup et assertions backend**
- Préparer l'état initial (créer des données de test)
- Vérifier l'état final du backend après actions UI
- Nettoyer après les tests
```javascript
// ✅ BON : Setup
await page.request.post('/api/combat/start', {...});
await page.goto('/combat');

// ✅ BON : Assertion backend après action UI
await page.click('button[data-action="attack"]');
const status = await page.request.get('/api/combat/status');
expect(status.inCombat).toBe(false);
```

❌ **INTERDIT : Actions utilisateur**
- Toute action qu'un utilisateur ferait via l'interface
- Attaquer, se déplacer, cliquer sur des boutons
- Soumettre des formulaires
```javascript
// ❌ MAUVAIS : Action via API
await page.request.post('/api/combat/action', {
  data: { actionType: "attack" }
});

// ✅ BON : Action via UI
await page.getByRole('button', { name: 'Attaquer' }).click();
await page.locator('[data-enemy-id="1"]').click();
```

### Structure d'un test E2E
```javascript
test('user journey', async ({ page }) => {
  // 1. SETUP (API OK)
  await page.request.post('/api/setup', {...});
  
  // 2. NAVIGATION (UI)
  await page.goto('/path');
  
  // 3. ACTIONS (UI SEULEMENT - pas d'API)
  await page.click('button');
  await page.fill('input', 'value');
  
  // 4. ASSERTIONS (UI + optionnel: vérif backend)
  await expect(page.locator('.result')).toBeVisible();
  const apiState = await page.request.get('/api/state');
  expect(apiState.data).toBe(expectedValue);
});
```

### Tests API

**Les tests API existent déjà dans les tests backend (ava).**
Ne les duplique pas dans Playwright - Playwright est pour l'UI uniquement.

### Résumé

**Test E2E = Simulation utilisateur réel**
- Setup : `page.request` ✅
- Actions : UI uniquement (`page.click()`, etc.) ❌ **JAMAIS `page.request`**
- Vérifications : UI + optionnel `page.request.get()` pour état backend ✅

**Si tu veux tester la logique API, utilise les tests backend (ava) existants.**