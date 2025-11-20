### Monorepo Quick Commands (NPM Workspaces)

This repository uses NPM workspaces. All packages are under `packages/` (backend, frontend, shared).

Install all dependencies (run once, at root):

```bash
npm install
```

If you prefer CI-style installs (fresh lockfile), use:

```bash
npm ci
```

Run both backend and frontend in dev:

```bash
npm run start:dev
```

Run only one package:

```bash
npm --workspace rpg-gemini-backend run start:dev
npm --workspace rpg-gemini-frontend run dev
```

Run tests:

```bash
npm test              # run backend + frontend tests sequentially
npm run test:backend  # run only backend tests
npm run test:frontend # run only frontend tests
```

Notes:

- If you get a permission error when Vite tries to bind to port `80`, run `npm --workspace rpg-gemini-frontend run dev -- --port 5173` or export `PORT=5173`.
- Some CI or build workflows may still reference top-level `frontend`/`backend`. CI config files in `.github/workflows` have been updated to `packages/*`, but please update your external systems if needed.
