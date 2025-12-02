## 🤖 Refactorisation archi backend

### 1. Contexte du Projet et Objectif 🎯

Prompt:

Je travaille sur un projet NestJS (Node.js/TypeScript) avec une architecture MVC étendue : Controller > Service > DTO/Model.

Mon objectif est d'introduire une couche d'**Orchestration** pour centraliser et coordonner les logiques métier qui nécessitent l'appel de plusieurs services de domaine. L'objectif est de garder les Services de Domaine purs (single responsibility) et d'éviter les appels directs entre domaines (exempple: chat ↔ combat ↔ character ↔ inventory ↔ dice).

Règles d'Architecture :

1. Les **Controllers** appellent uniquement les **Orchestrateurs** (Orchestrator).
2. Les **Orchestrateurs** coordonnent plusieurs **Services de Domaine**.
3. Les **Services de Domaine** restent purs et ne s'appellent pas entre eux.
4. Tous les éléments sont des injectables NestJS (`@Injectable()`, constructor DI).

### 2. Objectif de refactorisation — exemples concrets

But : ajouter une couche d'orchestration pour les scénarios multi-domaines, en commençant par les flux de `combat` (initialisation, tours d'attaque, fin de combat), et en corrigeant les points d'intégration actuels entre `chat`, `combat`, `character` et `dice`.

Extraits concrets du code (points d'entrée et méthodes observées) :

- `packages/backend/src/combat/combat.service.ts` (méthodes clefs) :

  - `initializeCombat(character, combatStart, userId)` — initialisation du combat.
  - `getCombatState(characterId)`, `isInCombat(characterId)`, `getCombatSummary(characterId)` — lecture / résumé d'état.
  - `applyDamageToEnemy(characterId, targetName, damage)` — applique dégâts, gère victoire/défaite et invoque `buildVictoryResult`.
  - `calculateXpReward(enemies)` — calcule le XP à distribuer.
  - `endCombat(characterId)` — nettoie la session et retourne `{ xpGained, enemiesDefeated }`.

- `packages/backend/src/combat/combat.controller.ts` (endpoints) :

  - `POST /combat/:characterId/start` → `initializeCombat`
  - `POST /combat/:characterId/attack/:actionToken` → logique d'attaque + `applyDamageToEnemy` / `getValidTargets`
  - `POST /combat/:characterId/resolve-roll/:actionToken` → application des dégâts via `applyDamageToEnemy`
  - `GET /combat/:characterId/status` → `getCombatSummary`, `getValidTargets`
  - `POST /combat/:characterId/end` → `endCombat`

- `packages/backend/src/chat/*` : le module chat traite des instructions de type `combat_start` / `combat_end` (voir `conversation.service.ts` et `external/text/ai-parser.util.ts`) et certains processors importent `CombatService`.

Problèmes observés :

- Le `CombatService` contient de la logique de flux (cleanup, calcul XP) qui devrait être orchestrée avec d'autres services (p.ex. `InventoryService.generateLoot`) ;
- Des composants non-combat (chat, processors) importent et appellent `CombatService` directement pour déclencher des scénarios multi-domaine ;
- Tests et maintenabilité deviennent difficiles quand la coordination est dispersée.

État cible (pattern d'orchestration) :

1. Introduire `orchestrators/` (p.ex. `packages/backend/src/orchestrators/combat/CombatManager.ts`).
2. Les contrôleurs et processors (chat) appellent uniquement ces orchestrateurs.
3. Les orchestrateurs injectent et orchestrent les services de domaine : `CombatService`, `InventoryService`, `CharacterService`, `ChatService`, `ActionRecordService`, etc.
4. Les services de domaine restent responsables de leur logique (calculs, persistence) mais ne coordonnent pas d'autres domaines.

Exemple concret de orchestration attendu pour la fin de combat (`processCombatEnd(characterId)`) :

1. Lire l'état : `const state = await combatService.getCombatState(characterId)`;
2. Identifier ennemis vaincus et calculer XP : `const xp = combatService.calculateXpReward(defeatedEnemies)`;
3. Générer loot : `const loot = await inventoryService.generateLoot(characterId, defeatedEnemies)`;
4. Finaliser / persister l'état : `await combatService.finalizeCombatState(characterId, { xp, loot })` (ou un schéma équivalent) ;
5. Émettre notifications/instructions via `chatService` ou `actionRecordService` (p.ex. envoyer `combat_end` payload avec `xp`, `loot`, `narrative`).

Remarque : la méthode existante `endCombat(characterId)` (dans `CombatService`) calcule déjà un `xpGained` et supprime la session — l'orchestrateur doit réutiliser/adapter ce comportement et l'enrichir (loot, notifications), sans déplacer la logique métier propre des services.

### 3. Fichiers à modifier / livrables d'exemple

Livrables demandés (exemples à fournir pour valider le pattern) :

1. `packages/backend/src/orchestrators/combat/CombatManager.ts` — nouvelle classe d'orchestration avec méthode `processCombatEnd(characterId: string)` et éventuellement `startCombat(...)` / `handleAttackResolution(...)` si utile.
2. `packages/backend/src/combat/combat.controller.ts` — contrôleur refactorisé : remplace les appels directs à `CombatService.endCombat` / `applyDamageToEnemy` par des appels à `CombatManager` pour les scénarios multi-service. Les endpoints restent les mêmes mais la dépendance change.
3. `packages/backend/src/combat/combat.service.ts` — service de domaine simplifié : conserver les méthodes computationnelles et de persistence (`initializeCombat`, `applyDamageToEnemy`, `calculateXpReward`, `endCombat`), mais retirer la coordination cross-domain (génération de loot, notification chat, etc.).
4. Exemple de migration dans `packages/backend/src/chat/game-instruction.processor.ts` ou `packages/backend/src/chat/conversation.service.ts` : montrer comment remplacer `CombatService` par `CombatManager` pour traiter `combat_start` / `combat_end`.
5. Tests unitaires minimaux pour `CombatManager.processCombatEnd` (mocker `CombatService` et `InventoryService`) et pour le `CombatController` refactorisé (integration légère avec mocks d'orchestrateur).

Contraintes et attentes :

- Respecter l'API publique existante (endpoints, shape des DTOs) autant que possible ;
- Ajouter des tests qui valident le flux orchestré (XP + loot + notification) sans exécuter l'intégralité des dépendances réelles (mocking) ;

### 4. Règles de revue / checklist PR

- PR doit montrer : fichiers changés, tests mis à jour/ajoutés, et un petit résumé expliquant comment la nouvelle couche d'orchestration remplace les appels inter-domaines précédents ;
- Vérifier que les services de domaine ne contiennent plus d'appels cross-domain (grep rapide) ;
- Vérifier que `chat` ne dépend plus directement de la coordination (il doit appeler l'orchestrateur quand nécessaire).
