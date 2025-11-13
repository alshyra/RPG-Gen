# Cypress Setup Complete ✓

## Summary

J'ai configuré avec succès Cypress pour tester votre application RPG-Gen. L'infrastructure de test est maintenant prête à être utilisée.

## Ce qui a été ajouté

### 📁 Configuration
- **cypress.config.ts** - Configuration principale de Cypress
- **cypress/tsconfig.json** - Support TypeScript complet
- Support des tests E2E et des tests de composants
- Scripts npm pour faciliter l'utilisation

### 🧪 Tests créés

#### Tests E2E (5 suites)
1. **smoke.cy.ts** - Tests de fumée (chargement de l'application)
2. **home.cy.ts** - Tests de la page d'accueil
3. **navigation.cy.ts** - Tests de navigation entre les routes
4. **world-selection.cy.ts** - Tests du sélecteur de monde (D&D, VtM, Cyberpunk)
5. **api-integration.cy.ts** - Exemples de tests avec mocking d'API

#### Tests de composants (1 exemple)
1. **UiButton.cy.ts** - Test complet du composant UiButton

### 📚 Documentation
- **CYPRESS.md** - Guide complet en français incluant:
  - Installation et configuration
  - Comment écrire des tests
  - Exemples de code
  - Bonnes pratiques
  - Intégration CI/CD
- **README.md** mis à jour avec les commandes de test

### 🛠️ Commandes disponibles

```bash
# Ouvrir l'interface Cypress (recommandé pour débuter)
npm run test:e2e:open

# Exécuter tous les tests en mode headless
npm run test:e2e
```

## Comment commencer

### 1. Installer Cypress (première fois)
```bash
cd frontend
npm install
```

### 2. Lancer l'application
Dans un terminal:
```bash
npm run dev
```

### 3. Ouvrir Cypress
Dans un autre terminal:
```bash
npm run test:e2e:open
```

Cela ouvrira l'interface graphique de Cypress où vous pourrez:
- Choisir entre tests E2E et tests de composants
- Sélectionner un navigateur (Chrome, Firefox, Edge, Electron)
- Cliquer sur un fichier de test pour l'exécuter
- Voir les tests s'exécuter en temps réel

### 4. Explorer les tests
Les tests sont organisés par fonctionnalité dans `frontend/cypress/e2e/`:
- Commencez par `smoke.cy.ts` - tests simples de chargement
- Puis `home.cy.ts` - tests de la page d'accueil
- Ensuite `world-selection.cy.ts` - tests d'interaction

## Exemples de tests

### Test E2E simple
```typescript
it('should display the home page title', () => {
  cy.visit('/');
  cy.contains('RPG Gemini').should('be.visible');
});
```

### Test avec interaction
```typescript
it('should navigate to character creation', () => {
  cy.visit('/');
  cy.contains('Dungeons & Dragons')
    .closest('.tpl')
    .find('button')
    .contains('Commencer')
    .click();
  cy.url().should('include', '/character');
});
```

### Test de composant
```typescript
it('should render button with primary variant', () => {
  cy.mount(UiButton, {
    slots: { default: 'Click me' },
  });
  cy.contains('Click me').should('be.visible');
});
```

## Structure des fichiers

```
frontend/
├── cypress/
│   ├── e2e/                  # Tests end-to-end
│   │   ├── smoke.cy.ts
│   │   ├── home.cy.ts
│   │   ├── navigation.cy.ts
│   │   ├── world-selection.cy.ts
│   │   └── api-integration.cy.ts
│   ├── component/            # Tests de composants
│   │   └── UiButton.cy.ts
│   ├── fixtures/             # Données de test
│   ├── support/              # Commandes personnalisées
│   ├── screenshots/          # Captures d'écran des échecs
│   └── videos/               # Vidéos des tests
├── cypress.config.ts
└── CYPRESS.md                # Documentation complète
```

## Prochaines étapes

### Pour ajouter de nouveaux tests E2E
1. Créez un nouveau fichier dans `cypress/e2e/` (ex: `character-creation.cy.ts`)
2. Suivez la structure des tests existants
3. Utilisez `cy.visit()`, `cy.get()`, `cy.contains()` pour interagir avec la page

### Pour tester un nouveau composant
1. Créez un fichier dans `cypress/component/` (ex: `MonComposant.cy.ts`)
2. Importez le composant: `import MonComposant from '../../src/components/MonComposant.vue'`
3. Utilisez `cy.mount()` pour le monter et le tester

### Pour mocker une API
```typescript
cy.intercept('POST', '/api/chat', {
  statusCode: 200,
  body: { message: 'Test response' }
}).as('chatRequest');
```

## Bonnes pratiques

1. **Utilisez data-cy attributes** pour des sélecteurs stables:
   ```html
   <button data-cy="start-game">Démarrer</button>
   ```
   ```typescript
   cy.dataCy('start-game').click();
   ```

2. **Isolez les tests** - chaque test doit être indépendant:
   ```typescript
   beforeEach(() => {
     cy.clearLocalStorage();
     cy.visit('/');
   });
   ```

3. **Évitez les wait() fixes** - préférez les assertions:
   ```typescript
   // ❌ Éviter
   cy.wait(2000);
   
   // ✅ Préférer
   cy.contains('Chargé').should('be.visible');
   ```

## Intégration CI/CD

Pour GitHub Actions, ajoutez dans `.github/workflows/test.yml`:
```yaml
- name: Run Cypress tests
  run: |
    npm run build
    npm start &
    npm run test:e2e
```

## Ressources

- [Documentation Cypress](https://docs.cypress.io/)
- [Cypress avec Vue](https://docs.cypress.io/guides/component-testing/vue/overview)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- Votre guide complet: `frontend/CYPRESS.md`

## Support

Si vous avez des questions ou besoin d'aide pour:
- Écrire de nouveaux tests
- Tester une fonctionnalité spécifique
- Configurer Cypress pour votre CI/CD
- Déboguer un test qui échoue

N'hésitez pas à demander !

---

## ✅ Vérifications effectuées

- ✅ Installation de Cypress réussie
- ✅ Configuration TypeScript validée
- ✅ 5 suites de tests E2E créées
- ✅ 1 test de composant exemple créé
- ✅ Compilation TypeScript réussie
- ✅ Build de l'application vérifiée
- ✅ Scan de sécurité CodeQL: 0 problème
- ✅ Documentation complète en français

Tout est prêt ! Vous pouvez commencer à tester votre application avec Cypress. 🎉
