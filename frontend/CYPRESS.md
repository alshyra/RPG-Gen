# Cypress Testing Guide

Ce projet utilise [Cypress](https://www.cypress.io/) pour les tests end-to-end (E2E) et les tests de composants.

## Installation

Cypress est déjà inclus dans les dépendances de développement. Pour installer les dépendances :

```bash
npm install
```

## Structure des tests

```
cypress/
├── e2e/              # Tests end-to-end
│   ├── home.cy.ts
│   ├── navigation.cy.ts
│   └── smoke.cy.ts
├── fixtures/         # Données de test
│   └── example.json
├── support/          # Commandes et configurations personnalisées
│   ├── commands.ts   # Commandes personnalisées
│   ├── e2e.ts        # Configuration E2E
│   └── component.ts  # Configuration des tests de composants
└── tsconfig.json     # Configuration TypeScript pour Cypress
```

## Exécution des tests

### Ouvrir Cypress en mode interactif

Pour ouvrir l'interface graphique de Cypress et exécuter les tests de manière interactive :

```bash
npm run test:e2e:open
```

### Exécuter les tests en mode headless

Pour exécuter tous les tests en ligne de commande (mode CI/CD) :

```bash
npm run test:e2e
```

### Exécuter un test spécifique

```bash
npx cypress run --spec "cypress/e2e/home.cy.ts"
```

## Écriture de tests

### Test E2E basique

```typescript
describe('Ma fonctionnalité', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('devrait afficher le titre', () => {
    cy.contains('RPG Gemini').should('be.visible');
  });

  it('devrait naviguer vers une autre page', () => {
    cy.get('button').click();
    cy.url().should('include', '/character');
  });
});
```

### Utilisation des commandes personnalisées

Le projet inclut une commande personnalisée `dataCy` pour sélectionner des éléments par attribut `data-cy` :

```typescript
// Dans votre composant Vue
<button data-cy="submit-button">Soumettre</button>

// Dans votre test
cy.dataCy('submit-button').click();
```

### Tests de composants

Pour tester un composant Vue isolément :

```typescript
import { mount } from 'cypress/vue';
import MonComposant from '../../src/components/MonComposant.vue';

describe('MonComposant', () => {
  it('devrait s\'afficher correctement', () => {
    cy.mount(MonComposant, {
      props: {
        title: 'Test'
      }
    });
    cy.contains('Test').should('be.visible');
  });
});
```

## Bonnes pratiques

1. **Utilisez des data-cy attributes** : Préférez `data-cy="mon-element"` plutôt que des sélecteurs CSS fragiles
2. **Isolez les tests** : Chaque test doit être indépendant et ne pas dépendre d'autres tests
3. **Nettoyez l'état** : Utilisez `beforeEach()` pour réinitialiser l'état (localStorage, cookies, etc.)
4. **Soyez explicite** : Utilisez des assertions claires et descriptives
5. **Évitez les wait fixes** : Utilisez les commandes Cypress qui attendent automatiquement (should, contains, etc.)

## Configuration

La configuration de Cypress se trouve dans `cypress.config.ts`. Voici les paramètres principaux :

- **baseUrl** : `http://localhost:5173` (URL de développement Vite)
- **viewportWidth** : 1280px
- **viewportHeight** : 720px
- **video** : Désactivé par défaut
- **screenshotOnRunFailure** : Activé

## Tests actuels

### smoke.cy.ts
Tests de fumée pour vérifier que l'application se charge correctement.

### home.cy.ts
Tests de la page d'accueil, incluant l'affichage du titre et du sélecteur de monde.

### navigation.cy.ts
Tests de navigation entre les différentes routes de l'application.

## Débogage

### Voir les tests en action
Utilisez `npm run test:e2e:open` pour voir les tests s'exécuter dans un navigateur.

### Capturer des screenshots
Cypress capture automatiquement des screenshots lors des échecs. Ils sont sauvegardés dans `cypress/screenshots/`.

### Utiliser le Cypress Debugger
Dans vos tests, vous pouvez utiliser :

```typescript
cy.pause();      // Pause le test
cy.debug();      // Affiche des informations de debug
```

## CI/CD

Pour intégrer Cypress dans votre pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run Cypress tests
  run: |
    npm run build
    npm run preview &
    npm run test:e2e
```

**Note** : Assurez-vous que l'application est en cours d'exécution sur `http://localhost:5173` avant de lancer les tests E2E.

## Ressources

- [Documentation Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress avec Vue](https://docs.cypress.io/guides/component-testing/vue/overview)
