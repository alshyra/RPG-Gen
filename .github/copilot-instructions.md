<!--
Short, focused instructions for AI coding agents working on this repository.
Keep changes small, explain impact, add tests and run CI locally when possible.
-->

# Copilot / AI contributor guide — RPG-Gen

Quick summary: This is a monorepo with two main packages: `packages/backend` (NestJS, MongoDB, Google Gemini) and `packages/frontend` (Vue 3, Vite, Tailwind). Shared DTOs live under `packages/shared` and are generated from backend schemas.

Core rules

- Always read the relevant code, tests and CI workflow before acting. Avoid taking irreversible actions without confirmation.
- Keep PRs atomic: one feature/fix per PR, include motivation, files touched and tests added/updated.

Project-specific tips

- Development: start everything with Docker Compose (root):
  - docker compose -f compose.dev.yml up -d
  - frontend: http://localhost:5173, backend: http://localhost:3001/docs
- Workspace scripts (root):
  - npm run start:dev to run backend+frontend concurrently
  - npm test to run backend + frontend tests

Tests & CI

- Backend uses AVA (packages/backend). Run in package folder: npm run test
- Frontend uses Vitest + Cypress (packages/frontend): npm run test, npm run test:e2e
- CI enforces lint+type checks, unit tests, and E2E runs with docker-compose. See `.github/workflows/qa-checks.yml` for exact steps.

Patterns & conventions to respect

- DTO generation: backend schemas ➜ generator script at `packages/backend/src/scripts/generate-dtos.ts`. Do not hand-edit generated files in `packages/shared/src/generated`. If schema changes are needed run `npm --workspace rpg-gemini-backend run generate:dtos` and commit the result.
- Chat / Gemini integration: `packages/backend/src/external/text/gemini-text.service.ts` — robust extraction/parsing of Gemini responses is central. Tests often mock or avoid non-deterministic AI outputs — prefer making Gemini interactions injectable/mocked in tests.
- Narrative parsing conventions: game instructions are embedded as JSON in narrative text and parsed by `packages/backend/src/external/game-parser.util.ts`. Tests expect specific JSON extraction and cleaning behavior.

Security / Deployment

- Secrets & tokens are never checked in. CI and Cloud Run rely on GitHub Secrets (see `.github/workflows/build-and-deploy.yml`). FRONTEND_URL and GOOGLE keys must be set for OAuth and AI calls.

Where to look first

- `README.md` — project overview + dev flow
- `packages/backend/src` — main backend code and tests
- `packages/frontend/src` — frontend UI, Cypress tests
- `packages/shared/src` — generated DTOs and public API shapes
- `.github/workflows` — CI steps, test orchestration, node versions and docker compose usage

If unclear: ask 1–2 clarifying questions before making changes (for example: "Do you want an API-only change or end-to-end validation?" or "Should I add unit tests, or a small integration test using Docker Compose?").

Note: See `.github/agents/dev.agent.md` for our conversational/approval rules and PR checklists — follow them when proposing changes.
