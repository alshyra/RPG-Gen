# Frontend (Vite + Vue)

## Installation and Development

Install and run (native tools):

```bash
cd packages/frontend
npm install
npm run dev
```

The dev server runs on http://localhost:5173 by default and proxies `/api` to `http://localhost:3001` (see `vite.config.ts`).

## Testing with Cypress

Ce projet utilise Cypress pour les tests E2E et les tests de composants.

### Quick Start

1. **Installer les dépendances** (si ce n'est pas déjà fait):

```bash
npm install
```

2. **Lancer l'application en développement** (dans un terminal):

```bash
npm run dev
```

3. **Ouvrir Cypress** (dans un autre terminal):

```bash
npm run test:e2e:open
```

4. **Ou exécuter les tests en mode headless**:

```bash
npm run test:e2e
```

### Run E2E against a live backend

E2E tests now run against a live backend by default. To run them locally or in CI you must ensure the backend is running and configured for test-mode:

- Set the backend environment variable DISABLE_AUTH_FOR_E2E=true so the server will accept requests originating from tests without requiring full OAuth/JWT verification.
- Start Cypress normally For example:

```bash
# ensure backend is running and DISABLE_AUTH_FOR_E2E=true is set on the backend process
cd packages/frontend
npx cypress run
```

Note: individual tests may still call `cy.intercept()` to simulate error responses or exceptional cases — this is allowed, but successful responses should use the real backend.

### E2E timing / profiling helper

If you're seeing slow E2E runs locally (eg. ~20s/test) you can collect per-test run durations which are written to:

    packages/frontend/test-reports/cypress-test-durations.json

Run the headless suite the usual way (or use the new script):

```bash
# run (instrumentation runs automatically via cypress.config.ts)
npm run test:e2e
```

### CI/CD

Les tests Cypress s'exécutent automatiquement via GitHub Actions sur chaque push et pull request vers les branches `main` et `develop`. Les screenshots et vidéos sont disponibles en tant qu'artifacts en cas d'échec.

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build l'application pour la production
- `npm run preview` - Prévisualise le build de production
- `npm run test` - Lance les tests unitaires (Vitest)
- `npm run test:e2e` - Lance les tests E2E Cypress en mode headless
- `npm run test:e2e:open` - Ouvre l'interface Cypress
- `npm run type-check` - Vérifie les types TypeScript
- `npm run lint` - Lint le code
- `npm run lint:fix` - Lint et corrige automatiquement le code
