## Plan: Rendu tour-par-tour (backend)

TL;DR — Mettre en place un flux tour-par-tour complet : modéliser l'économie d'actions côté session, exposer un endpoint `end-turn`, décrémenter/valider `actionsRemaining` à chaque action, persister la phase (`PLAYER_TURN` / `ENEMY_TURN` / `AWAITING_DAMAGE_ROLL`), et déclencher la résolution des tours ennemis.

### Action Economy (D&D)

L'économie d'actions doit suivre le modèle D&D 5e : chaque joueur dispose par défaut de 1 _action_ et 1 _bonus action_ par tour. Ces nombres peuvent être modifiés par des compétences, des dons ou des sorts du personnage.

- `action` (ex: attaquer, lancer certains sorts, se déplacer en tant qu'action spéciale) — par défaut 1 par tour.
- `bonus action` (ex: utiliser une potion rapide, se cacher rapidement, désengager) — par défaut 1 par tour.

Une attaque consomme une _action_. Utiliser une potion, se cacher, ou se désengager sont considérés comme des _bonus actions_ et doivent décrémenter le compteur correspondant.

L'interface de session combat doit donc exposer et persister séparément : `actionRemaining`, `bonusActionRemaining`, `actionMax`, `bonusActionMax`.

Remarque importante : c'est bien le joueur qui **doit** cliquer sur le bouton `Fin de tour` pour changer de phase et déclencher le tour des ennemis. Par défaut, le serveur **n'avance pas automatiquement** la phase — l'appel explicite à l'endpoint `end-turn` est la source de vérité pour passer en `ENEMY_TURN`. Une option d'auto‑avancement (quand `actionRemaining` et `bonusActionRemaining` sont à 0) peut être fournie mais ne doit pas être le comportement par défaut.

### Steps

1. Ajouter `actionsRemaining` et `actionMax` dans le schéma `packages/backend/src/combat/combat-session.schema.ts` et DTO `packages/backend/src/combat/dto/CombatStateDto.ts`.
   - Implémenter en fait deux compteurs : `actionRemaining`/`actionMax` et `bonusActionRemaining`/`bonusActionMax`.
2. Mettre à jour `packages/backend/src/combat/combat.service.ts` pour décrémenter `actionsRemaining` lors de `performAttack` / `applyDamageToEnemy`.
   - Décrémenter `actionRemaining` pour les attaques et `bonusActionRemaining` pour potions/hide/disengage.
3. Implémenter `CombatService.endPlayerTurn` comme le point d'entrée explicite qui **change la phase** : vérifier (optionnel) l'état des compteurs, basculer `phase` en `ENEMY_TURN`, exécuter `processEnemyAttacks(...)`, avancer `currentTurnIndex` / `roundNumber`, puis repasser en `PLAYER_TURN` et réinitialiser `actionRemaining`/`bonusActionRemaining`.
   - Comportement : `endPlayerTurn` **doit** être invoqué par le client (le clic bouton) pour déclencher la phase ennemie. L'API peut accepter une terminaison volontaire même si des actions restent, mais **ne doit pas** auto‑avancer sans configuration explicite.
4. Modifier le flux `attack -> resolve-roll` (action tokens) pour **ne jamais** lancer automatiquement la phase ennemie ; au lieu de cela, renvoyer l'état courant (ou `AWAITING_DAMAGE_ROLL` si on attend un jet côté client). La phase ennemie ne démarre que lorsque le client appelle explicitement `end-turn`.

5. Exposer champs clairs dans réponses API (`actionToken`, `expectedDto`, `phase`, `actionsRemaining`, `turnOrder`, `currentTurnIndex`) depuis `combat.controller` pour que le frontend puisse afficher l'état.

6. Tests: Ajouter unités et intégration couvrant multi-actions par tour / `end-turn`

- add unit tests in `packages/backend/test`
- add integration tests with cypress

---

**Integration details (player activation per enemy & UI flow)**

- Activation duplication: pour donner au joueur autant d'activations que d'adversaires par round, construire `turnOrder` en dupliquant l'entrée joueur `N` fois (N = nombre d'ennemis vivants) lors de l'initialisation. Chaque duplication garde un `originId` commun au joueur.
- Exemple d'ordre (ton scénario):
  - Ennemis: `gob2 (initiative 16)`, `gob1 (initiative 15)`; joueur `hero (initiative 11)`; avec duplication joueur×2 -> ordre d'activation effectif qui permet alternance: `gob2 -> hero#1 -> gob1 -> hero#2 -> (round end) -> gob2 ...`.
- UI flow:
  1.  Le joueur clique sur un ennemi dans le `CombatPanel`.
  2.  Modal s'ouvre: affiche chance de toucher (ou instruction de jet) — si un jet côté client est demandé, la modal propose "Lancer le dé".
  3.  Le joueur clique pour lancer le jet de dégâts; le client appelle `POST /api/combat/:characterId/resolve-roll/:actionToken` et **le backend applique les dégâts** et décrémente `actionRemaining` (attaque consommée).
  4.  Après application, le backend retourne le `TurnResultWithInstructionsDto` (playerAttacks, enemyAttacks éventuels, remainingEnemies, narrative). **Le client n'avance pas** au combattant suivant automatiquement.
  5.  Le joueur clique sur `Fin de tour` pour indiquer la fin de son activation courante. Le client appelle `POST /api/combat/:characterId/end-activation` (ou `end-turn`) — le serveur avance `currentTurnIndex`. Si la ou les activations intermédiaires sont des ennemis, le serveur les résout immédiatement (attaques ennemies), persiste et renvoie l'état final prêt pour la prochaine activation joueur.

**Règles côté backend**

- `resolve-roll` applique dégâts et décrémente immédiatement `actionRemaining` (attaque consommée).
- `end-activation` avance l'index d'activation. Le serveur résout automatiquement les activations ennemies consécutives et s'arrête lorsque la prochaine activation est une duplication joueur (prête pour interaction client) ou le round est terminé.
- Si un ennemi meurt, recompute minimal du `turnOrder` (retirer activations liées à ennemis morts); la duplication du joueur peut rester ou être recalculée selon desired balance (préconiser recalculer pour garder N = nombre d'ennemis vivants au round start).

**Tests à ajouter (détaillés)**

- Unit: `buildTurnOrder` avec duplications selon N ennemis — assert ordre attendu.
- Unit: `resolve-roll` décrémente `actionRemaining` et applique dégâts correctement.
- Integration (backend): start combat with 2 enemies -> player attack resolve -> end-activation -> server resolves next enemy -> player activation again -> end-activation -> cycle continues.
- E2E (Cypress): simulate UI clicks (select enemy, modal roll, resolve, click Fin de tour) and assert animations/state updates.

**Priorités d'implémentation**

1. Backend: schema `actionRemaining`/`bonusActionRemaining` + `turnOrder` duplication logic in `initializeCombat` (`combat-session.schema.ts`, `combat.service.ts`).
2. Backend: `POST /api/combat/:characterId/end-activation` and `CombatService.advanceTurn` resolving enemies intercalés.
3. Backend: ensure `resolve-roll` decrements action counters and persists.
4. Frontend: `Fin de tour` button in `CombatPanel.vue` wired to call `end-activation` and refresh state.
5. Tests: unit + integration + E2E.

