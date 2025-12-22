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

- Avoid for loops: prefer array methods (`map`, `filter`, `reduce`, `forEach`) and functional patterns. Use `for...of` only when async/await is needed or for early exits.

- **One class per file**: Each TypeScript class/DTO must be in its own file. Helper classes, nested types, or utility classes (e.g., used only internally by one DTO) may share a file, but primary exported classes must be isolated. This improves organization, testability, and makes imports/exports explicit.

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

Security / Deployment

- Secrets & tokens are never checked in. CI and Cloud Run rely on GitHub Secrets (see `.github/workflows/build-and-deploy.yml`). FRONTEND_URL and GOOGLE keys must be set for OAuth and AI calls.

Where to look first

- `README.md` — project overview + dev flow
- `apps/backend/src` — main backend code and tests
- `apps/frontend/src` — frontend UI, Cypress tests
- `packages/shared/src` — generated DTOs and public API shapes
- `packages/ui` — shared Vue 3 components and styles
- `packages/api-client` — TypeScript API client for frontend-backend communication wrapped in vuequery
- `packages/combat-engine` — PixiJS combat engine, frontend core game logic
- `.github/workflows` — CI steps, test orchestration, node versions and docker compose usage

If unclear: ask 1–2 clarifying questions before making changes (for example: "Do you want an API-only change or end-to-end validation?" or "Should I add unit tests, or a small integration test using Docker Compose?").

Note: See `.github/agents/dev.agent.md` for our conversational/approval rules and PR checklists — follow them when proposing changes.

<instructions>
<instruction>
<file>\.github/instructions/api-client-usage.instructions.md</file>
<applyTo>packages/api-client/src/**/*.ts, apps/frontend/src/services/**/*.ts, apps/frontend/src/composables/**/*.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/backend-controllers.instructions.md</file>
<applyTo>apps/backend/src/controllers/**/*.controller.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/backend-seeds.instructions.md</file>
<applyTo>apps/backend/src/seed/**/*.json, apps/backend/src/seed-manager.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/combat-engine.instructions.md</file>
<applyTo>packages/combat-engine/src/**/*.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/dto-generation.instructions.md</file>
<applyTo>apps/backend/src/scripts/generate-dtos.ts, packages/shared/src/generated/**/*.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/e2e-playwright-tests.instructions.md</file>
<applyTo>packages/e2e/tests/**/*.spec.ts, packages/combat-engine/tests/**/*.spec.ts, apps/frontend/src/**/*.spec.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/game-narrative-parsing.instructions.md</file>
<applyTo>apps/backend/src/external/game-parser.util.ts, apps/backend/src/orchestrators/**/*.ts</applyTo>
</instruction>
<instruction>
<file>\.github/instructions/gemini-chat.instructions.md</file>
<applyTo>apps/backend/src/external/text/gemini-text.service.ts, apps/backend/src/modules/chat/**/*.ts, apps/backend/src/controllers/chat.controller.ts</applyTo>
</instruction>
</instructions>

