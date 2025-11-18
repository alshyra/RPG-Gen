# Prompt — Revue de l'architecture Front

Objectif

- Revoir l’architecture front pour garantir des types partagés, une séparation claire responsabilités UI/composables et une unification composables+stores (Pinia setup API).
- Garantir que les types partagés (DTOs) dérivent du modèle de base de données afin d’éviter dérive entre back & front.

Contraintes essentielles

- Les DTO/types doivent être source-of-truth partagée : ne pas dupliquer manuellement les interfaces.
- Les composants enfants ne doivent pas notifier leurs parents via props: utiliser composables/stores pour la communication.
- Fusionner les composables et stores : Pinia (setup API) remplace les composables autonomes pour la plupart des usages.

Propositions techniques (haute priorité)

1. Monorepo + package shared

   - Créer un package partagé `packages/shared` exposant les DTOs/types / enums / types utilitaires.
   - Front et Back importent ce package via workspaces (npm) ou via tsconfig paths.
   - Exemple : `import { CharacterDto } from '@rpg/shared'`.
   - Pas besoin de publier sur npm : privilégier le workspace local (npm) ou `file:` link pour de petits setups.

     - Workspace (recommandé) : root `package.json`:

     ```json
     {
       "private": true,
       "workspaces": ["packages/*", "frontend", "backend"]
     }
     ```

     puis `npm install` et packages seront symlinkés.

     - File link (alternatif) : si vous ne souhaitez pas utiliser workspaces,
       dans `frontend/package.json` et/ou `backend/package.json`:
       ```json
       "dependencies": {
         "@rpg/shared": "file:../packages/shared"
       }
       ```
     - Toujours garder `packages/shared` "private": true pour éviter publication accidentelle.

   - tsconfig paths: pour DX confort (import sans ../../), configurer tsconfig.base.json paths:
     ```json
     "paths": {
       "@rpg/shared": ["packages/shared/src/index.ts"]
     }
     ```

2. Génération automatique des DTOs depuis le modèle DB

   - NestJS (Mongoose): utiliser un script `ts-morph` pour scanner `backend/src/schemas` et générer des interfaces DTO dans `packages/shared/src/generated`.
   - Peut-être avec un hook npm : prestart ? postinstall ?.
   - Règle: DTOs must be "types only" (no business logic) and live in `packages/shared`. Front & Back import them via workspaces/tsconfig paths.
   - Implementation snippet:
     - Use `ts-morph` to parse classes with `@Schema()` and create `export interface XxxDto { ... }`
     - Replace `MongooseSchema.Types.ObjectId` → `string` in DTOs.
     - Map nested classes to `<NestedName>Dto`.
     - Keep the generated files idempotent (overwrite only if changed).

3. CI

Rien à faire

4. Éviter props parent pour notifications

   - Remplacer communications parent-child par :
   - Remplacer communications parent-child par :
     - store Pinia central (ex: `useUiStore`, `useCharacterStore`) ou
     - event composable centralisé (ex: `useEventBus`) exposé via `packages/shared`.
   - Exemples : quand un composant enfant doit notifier un parent, il déclenche `uiStore.notify('roll-start', payload)` ou appelle `useGameStore().onRoll(payload)`.
   - Nouvelle règle stricte : si le composable ou store couvre l'usage, ne pas utiliser de props/emit pour notifier un parent. Les composants enfants restent "UI" : lisent/écrivent dans le store, mais ne gèrent pas la navigation/protocoles.
   - Seule exception pour les composants UI qui on besoin et doivent garder ce comportement.
     Migration example: remplacer un emit 'next' par store

   1. Créer `useWizardStore` (Pinia) exposant: `currentStep`, `form` state, `next()`, `prev()`, `setFormPartial()`.
   2. Dans `StepBasicInfo.vue`, remplacer :
      - emit('next') -> call `wizard.next()`
      - emit('update', payload) -> call `wizard.setFormPartial(payload)`
   3. Dans `CharacterCreatorWizard.vue` parent, remplacer `@child-next="...` listeners by `watch(wizard.currentStep, ...)` or computed + render logic.

   Example code snippet :

   ```typescript
   // ...example...
   ```

5. Fusion composables + stores (Pinia setup API)
   - Stratégie : migrer les composables stateful en stores Pinia setup-style :
     - `export const useCharacterStore = defineStore('character', () => { const chars = ref(...); function add(...) {...}; return { chars, add }; })`
   - Règle : garder petites fonctions (pure utilities) comme composables utilitaires, mais centraliser état et effets dans Pinia.
   - Import structure (important):
   - Import structure (important):
     - UI component => business component => 1..n ComposableStore
     - For each ComposableStore => 1 typed ApiService (uses DTOs from `@rpg/shared`)
     - Example: `StepRaceClass.vue` (UI) -> `CharacterCreator.vue` (business) -> `useCharacterStore()` -> `characterService` (typed api)
   - DTO notes:
     - DTOs should model the persisted shape; generated from DB schema if possible.
     - Sub-DTOs are allowed for specific flows:
       - Create DTO: `CreateUserDto` is usually `Omit<UserDto, 'id'|'createdAt'|...>` — fields generated server-side are omitted.
       - Update DTO: `Partial<CreateUserDto>` — partial for patch operations.
     - Generation proposal:
       - The DTO generator must also emit `CreateXxxDto` and `UpdateXxxDto` aliases using `Omit` and `Partial` so front/back reuse these typings.
       - Example: `CreateCharacterDto = Omit<CharacterDto, 'userId' | 'characterId' | 'createdAt' | 'updatedAt'>;` and `UpdateCharacterDto = Partial<CreateCharacterDto>;`
   - When to use:
   - When to use:
     - Use Create DTO for POST payloads (form submission).
     - Use Update DTO for PATCH-like updates or partial saves.
     - Use full `XxxDto` when reading from backend / persisted entity.

- Keep DTOs deterministic: generator must ensure output is idempotent. Do not add CI checks that enforce DTO generation; prefer local generation hooks, `postinstall` or pre-commit checks to keep developers in control.

  - Store placement: put Pinia setup stores in `frontend/src/composables` rather than `frontend/src/stores` to unify composables and stores. When migrating, remove duplicate files under `frontend/src/stores` and update imports to `@/composables/<storeName>`.

Plan de migration (itératif)

- Étape 0 : ajouter workspace `packages/shared` + config tsconfig.
- Étape 1 : générer DTOs initiales (script). Vérifier import côté front/back.
- Étape 2 : migrer 1 composable critique -> store Pinia `useCharacterStore`.
- Étape 2 : migrer 1 composable critique -> store Pinia `useCharacterStore`.
- Étape 3.5 : centraliser les notifications d'app via `useEventBus` (shared) et `useUiStore` (frontend) pour éviter les emits parent-child sur les événements applicatifs.
- Étape 3 : remplacer notifications parent/props par store invocations pour 1 feature (ex: wizard steps).
- Étape 4 : automatiser génération DTOs (localement). Ne pas exiger une vérification CI pour les types — utiliser un script local, un hook precommit ou postinstall pour garder les DTOs à jour.
- Étape 5 : documentation + tests unitaires + e2e.

Critères d’acceptation

- Toutes les interfaces de l’API consommées par le front proviennent de `packages/shared`.
- Aucun composant enfant n’émet d’évènement via props pour notifier un parent — vérification via grep/test lint.
- Les composables stateful majeurs migrés vers Pinia et exposent la même API testée.
  -- NOTE: n'ajoutez pas de vérification CI pour l'actualisation des DTOs; gestion manuelle via `generate:dtos` et hooks locaux recommandée.

Checklist technique / règles

- Pas de duplication de types → tsconfig paths + workspace.
- Exposer DTOs only (pas d’implémentation logique) dans `packages/shared`.
- Garder composants `pure` UI (pas d’actions réseau) — utiliser store/composable pour side-effects.
- Ajouter test E2E pour le flux de création de personnage après migration.
- Mettre à jour docs: `frontend/README` & `backend/README` pour la génération DTOs.

Risques & alternatives

- Si génération depuis DB trop lente/complexe : fallback via OpenAPI generation puis mapping/validation côté front.
- Si migration Pinia perturbe tests : convertir feature par feature avec toggles.

Notes finales

- Respecter contrainte de newline et persistance (backend) pour que les titres/messages ne soient pas altérés.
- Prioriser incohérence des types entre back & front — la génération automatique supprime l’erreur humaine.
- L’objectif est d’avoir un front déclaratif, sans props-parent notifications, et une base de types fiable issue du modèle DB.
- If composables + stores work, no props are required between parent and children for notifications: all cross-component coordination should be done through stores/composables.

Commentaires : éviter les tautologies

- Règle courte : un commentaire doit ajouter du contexte (pourquoi / contrainte / conséquence) — pas redire ce que le code fait.
- Exemples :
  - Mauvais : // increment i by 1
  - Bon : // we need to increment i to avoid off-by-one error in the loop
- Utilisation : dans les fichiers de schéma et services, privilégier les commentaires qui expliquent la raison des choix (index, options par défaut, contraintes de validation, comportement attendu en cas d'erreur).
- Vérification : un grep lint peut repérer les commentaires trop courts/tautologiques pour revue manuelle.
