---
applyTo: "packages/e2e/tests/**/*.spec.ts, packages/combat-engine/tests/**/*.spec.ts, apps/frontend/src/**/*.spec.ts"
---

# E2E Playwright Tests Instructions

Ce document énonce les principes fondamentaux et les règles strictes pour la création et la maintenance des tests End-to-End (E2E) avec Playwright.

**Principe Fondamental : Simulation Utilisateur Réel**

Un test E2E doit simuler le comportement d'un véritable utilisateur. L'utilisateur ne fait **PAS** d'appels API directs, il clique, tape et navigue via l'interface utilisateur (UI).

**Quand utiliser `page.request` (API directe) :**

✅ **AUTORISÉ : Setup et Assertions Backend**
*   Préparer l'état initial du backend (créer des données de test, configurer l'environnement).
*   Vérifier l'état final du backend après des actions effectuées via l'UI.
*   Nettoyer les données ou l'état du backend après les tests.

```javascript
// ✅ BON : Setup - Création d'un personnage via API avant les interactions UI
await page.request.post('/api/character', { data: { name: 'Hero', class: 'guerrier' } });
await page.goto('/game/start');

// ✅ BON : Assertion backend après action UI - Vérifier le statut de combat via API
await page.getByRole('button', { name: 'Attaquer' }).click();
const combatStatus = await page.request.get('/api/combat/status');
expect(combatStatus.data.inCombat).toBe(true);
```

❌ **INTERDIT : Actions Utilisateur via API**

*   Toute action qu'un utilisateur ferait via l'interface graphique (attaquer, se déplacer, cliquer sur des boutons, soumettre des formulaires) ne doit **jamais** être effectuée via `page.request`.

```javascript
// ❌ MAUVAIS : Action via API - Simuler une attaque
await page.request.post('/api/combat/action', {
  data: { actionType: "attack", targetId: "enemy-1" }
});

// ✅ BON : Action via UI - Cliquer sur le bouton d'attaque et sélectionner une cible
await page.getByRole('button', { name: 'Attaquer' }).click();
await page.locator('[data-enemy-id="enemy-1"]').click();
```

**Structure d'un Test E2E :**

```javascript
test('User can complete a combat encounter', async ({ page }) => {
  // 1. SETUP (API Autorisé)
  await page.request.post('/api/game/setup', { data: { scenario: 'forest-fight' } });
  
  // 2. NAVIGATION (UI Seulement)
  await page.goto('/combat/arena');
  
  // 3. ACTIONS UTILISATEUR (UI Seulement - PAS d'API)
  await page.getByRole('button', { name: 'Attaquer' }).click();
  await page.locator('[data-enemy-id="goblin-1"]').click();
  await page.getByRole('button', { name: 'Utiliser Sort' }).click();
  await page.getByText('Boule de Feu').click();
  
  // 4. ASSERTIONS (UI + Optionnel : Vérification Backend)
  await expect(page.locator('.combat-log')).toContainText('Goblin defeated!');
  const finalGameState = await page.request.get('/api/game/state');
  expect(finalGameState.data.player.experience).toBeGreaterThan(0);
});
```

**Tests API :**

Les tests API spécifiques existent déjà dans les tests backend (AVA). Ne les dupliquez pas dans Playwright. Playwright est dédié à la validation de l'expérience utilisateur via l'UI.

**Résumé :**

*   **Setup :** `page.request` ✅ (pour préparer l'état du backend).
*   **Actions Utilisateur :** UI uniquement (`page.click()`, `page.fill()`, etc.) ❌ **JAMAIS `page.request`** (pour simuler des interactions utilisateur).
*   **Vérifications :** UI (`expect(locator)`) + optionnel `page.request.get()` (pour vérifier l'état du backend après actions UI) ✅.