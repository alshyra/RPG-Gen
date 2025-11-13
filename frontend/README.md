# Frontend (Vite + Vue)

## Installation and Development

Install and run (native tools):

```bash
cd frontend
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

### Documentation complète

Pour plus d'informations sur les tests Cypress, consultez [CYPRESS.md](./CYPRESS.md).

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
