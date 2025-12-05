# Plan concis — Usage des potions de soin

Résumé

- **Objectif** : Faire en sorte que les potions de soin soient utilisables uniquement en combat, que les rations servent hors-combat, que l'instruction contienne un `itemId`, et que le backend applique l'effet (calcul HP) puis retourne l'état de combat mis à jour.

Décision d'architecture

- **Orchestrator choisi** : `ItemOrchestrator` — centralise toute la logique d'utilisation d'objets (consommables, équipements, narration).
- **Raisons** : testé séparément, évite de surcharger `ChatOrchestrator`, facilite les tests et la réutilisation (CLI/frontend/Gemini).

Changements requis (bref)

- **DTOs / API** : ajouter `itemId?: string` dans `InventoryInstructionMessageDto`. `name` reste support en fallback.
- **Seed / meta items** : enrichir `item-definitions.json` pour `potion-health` :
  - `meta.type = "consumable"`
  - `meta.combatUsable = true`
  - `meta.restUsable = false`
  - `meta.healDice` (ex. `1d6+2`) selon règles désirées
- **Backend** :
  - Ajouter `ItemOrchestrator.handleInventoryInstruction(userId, characterId, instr)`.
  - `ItemOrchestrator` : charge l'item (par `inventory._id`), valide contexte (combat ou hors combat), calcule l'effet (heal), appelle `CombatAppService.applyPlayerHeal(characterId, amount)` si en combat, persiste et retourne `CombatStateDto` ou `CharacterDto` selon chemin.
  - ajouter un point d'entrée dans le controller approprié (ex. `InventoryController`).
  - migrer ce qui doit l'être de `ChatOrchestrator` vers `ItemOrchestrator`.
- **CombatAppService** : ajouter `applyPlayerHeal(characterId, amount)` pour gérer l'augmentation des HP.
- **CharacterService** : conserver `removeInventoryItem(itemId, qty)` tel quel ; `ItemOrchestrator` l'appelle après validation.
- **Frontend** : envoyer `InventoryInstructionMessage` avec `itemId` (au lieu de mettre `_id` dans `name`), afficher la réponse `CombatStateDto` et mettre à jour les stores. Utiliser le nouveau point d'entrée API.

Tests recommandés

- Unitaires : DTO, `ItemOrchestrator` règles de validation (combat vs hors-combat), calcul heal.
- Intégration : un test où un combat simulé reçoit la mise à jour après utilisation de potion.
- E2E : front -> backend flow (exécuter `use` depuis UI, vérifier store/UI et inventaire).

Notes pratiques

- Si une instruction arrive sans `itemId` throw une erreur 400.
- Commencer par DTO+seed, puis orchestrator, puis intégration combat, puis frontend.
