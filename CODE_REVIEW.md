# Code Review & Architecture Analysis - RPG-Gen

## 📋 Résumé Exécutif

Le projet RPG-Gen est une application de jeu de rôle assistée par IA (Google Gemini). L'architecture est relativement bien organisée en deux couches (frontend Vue3 + backend NestJS), mais présente plusieurs opportunités d'amélioration.

---

## 🏗️ Architecture Générale

### Frontend (Vue 3 + TypeScript + Tailwind)

```
src/
├── components/      # Composants Vue réutilisables
├── services/        # Logique métier (characterService, gameEngine, etc.)
├── views/           # Pages principales
├── ui/              # Composants UI bas-niveau
├── utils/           # Utilitaires (dndLevels.ts)
└── router/          # Configuration Vue Router
```

**Points positifs:**

- ✅ Séparation claire composants/services
- ✅ Services indépendants (sans dépendances circulaires)
- ✅ Utilisation appropriée de Vue 3 Composition API

**Points d'amélioration:**

- ❌ Peu de typage strict (beaucoup d'`any`)
- ❌ GameView.vue est trop volumineux (290 lignes)
- ❌ Code dupliqué dans les composants de création de personnage

### Backend (NestJS + TypeScript)

```
src/
├── chat/            # Module de chat (controller + service)
├── dice/            # Module de dés
├── image/           # Module d'images
├── shared/          # Utilitaires partagés
└── app.module.ts    # Configuration principale
```

**Points positifs:**

- ✅ Architecture modulaire NestJS propre
- ✅ Séparation des responsabilités

**Points d'amélioration:**

- ❌ gemini.service.ts contient trop de logique d'IA
- ❌ Pas de gestion d'erreurs cohérente
- ❌ Pas de validations DTO

---

## 🔴 Problèmes Identifiés

### 1. **Code Dupliqué (Duplicates)**

#### Frontend:

**CharacterCreator.vue vs CharacterCreatorWizard.vue (280 lignes chacun)**

- Même logique de création de personnage
- Seulement l'interface diffère (wizard vs. formulaire)
- **Solution:** Extraire la logique dans un composable réutilisable

```typescript
// À créer: useCharacterCreation.ts
export const useCharacterCreation = () => {
  const character = ref(...)
  const applyRacialAndCompute = () => { ... }
  const saveCharacter = () => { ... }
  return { character, applyRacialAndCompute, saveCharacter }
}
```

**AbilityScores.vue + AbilityScorePicker.vue**

- Logique d'affichage vs. de modification d'ability scores
- Pourraient être combinés avec props pour switcher les modes

#### Backend:

**Peu de duplication détectée** ✅

### 2. **Code Mort (Dead Code)**

#### Frontend:

- `HeaderBar.vue`: Composant importé dans GameView mais jamais utilisé
- `PromptCarousel.vue`: Composant complet non intégré
- `gameEngine.formatInstruction()`: Méthode jamais appelée
- `gameEngine.formatRollResult()`: Méthode nunca appelée
- Variables inutilisées: `attemptIndex` dans CharacterIllustration.vue

#### Backend:

- `/api/image` endpoint: Implémenté mais pas d'image generation réelle
- `game-parser.util.ts`: Parseur potentiellement peu utilisé

### 3. **Problèmes de TypeScript (any abuse)**

#### Frontend - Pires contrevenants:

1. `DiceRoll.vue`: `pendingInstruction?: GameInstruction | null` mais reçoit `any`
2. `CharacterCreator.vue`: Objets `Race` et `Character` non typés correctement
3. `GameView.vue`: `append()` prend des `string` mais peut recevoir des objets
4. `RacePicker.vue`: Fonction `summaryMods(mods:any)` devrait être typée

#### Backend - Violations:

- 28 warnings pour `any` utilisé
- `chat.controller.ts`: 12 instances de `any`
- `gemini.service.ts`: 8 instances de `any`

### 4. **Problèmes d'Organisation**

#### Frontend:

1. **GameView.vue trop gros** (290 lignes)

   - Devrait être scindé:
     - `useGameSession.ts` (logique session)
     - `useGameMessages.ts` (gestion messages)
     - `useGameRolls.ts` (gestion des dés)

2. **Constants éparpillées**

   - Classes D&D dans 3 fichiers différents
   - Worlds mapping dans HomeView et CharacterCreatorView

3. **Services sans interfaces claires**
   - `gameEngine` est une classe avec singleton export
   - `characterService` mélange localStorage et logique métier

#### Backend:

1. **gemini.service.ts surchargé** (103 lignes)

   - Contient parsing AI + construction prompts + API calls
   - Devrait être scindé

2. **Pas de DTOs**
   - Les données ne sont pas validées à l'entrée
   - Aucune transformation standardisée

### 5. **Architecturaux**

#### Frontend - Points Faibles:

- ❌ Pas de store global (Pinia/Vuex) → prop drilling
- ❌ Services avec `localStorage` couplés aux composants
- ❌ Pas d'error boundary ou gestion d'erreurs cohérente
- ❌ Types d'instructions de jeu peu documentés

#### Backend - Points Faibles:

- ❌ Session management basique (pas de DB)
- ❌ Pas d'authentification
- ❌ Pas de rate limiting
- ❌ Archive characters stockée en JSON brut

---

## ✅ Points Forts

### Frontend:

- ✅ Good CSS organization (Tailwind + scoped styles)
- ✅ Proper router setup
- ✅ DnD rules service well-encapsulated
- ✅ XP progression system clean

### Backend:

- ✅ Clean NestJS module structure
- ✅ Service injection pattern followed
- ✅ Controller routing clear
- ✅ Game parsing logic isolated

---

## 🎯 Recommandations Prioritaires

### P1 (Urgent):

1. **Créer une Pinia store** pour l'état global du jeu

   ```typescript
   // stores/gameStore.ts
   export const useGameStore = defineStore('game', {
     state: () => ({ currentCharacter, messages, ... }),
     actions: { sendMessage(), rollDice(), ... }
   })
   ```

2. **Refactoriser GameView.vue** en composables

   ```typescript
   // composables/useGameSession.ts
   // composables/useGameMessages.ts
   // composables/useGameRolls.ts
   ```

3. **Créer DTOs Backend** pour validation
   ```typescript
   // src/chat/dto/send-message.dto.ts
   export class SendMessageDto {
     @IsString() message: string;
     @IsUUID() sessionId: string;
     @IsObject() character: any;
   }
   ```

### P2 (Important):

1. Merger CharacterCreator + CharacterCreatorWizard via un mode prop
2. Extraire constants dans `src/constants/`
3. Ajouter typed error handling
4. Créer interfaces partagées en `src/types/`

### P3 (Nice to have):

1. Implémenter vraie authentification
2. Ajouter tests unitaires
3. Setup Storybook pour components
4. Documentation API (Swagger déjà partiellement setup)

---

## 📊 Métriques

| Métrique                         | Frontend | Backend |
| -------------------------------- | -------- | ------- |
| Fichiers `.ts/.tsx/.vue`         | 35+      | 15+     |
| Lignes de code moyen par fichier | 150      | 80      |
| % de `any` usage                 | ~12%     | ~8%     |
| Composants réutilisables         | 18       | -       |
| Services                         | 5        | 3+      |
| Utilisation pinia                | ❌       | -       |
| Coverage tests                   | <5%      | <5%     |

---

## 🛠️ Prochaines Étapes

1. **Setup ESLint+Prettier** ✅ (Fait)
2. **Ajouter TypeScript strict mode** (à faire)
3. **Créer store Pinia** (à faire)
4. **Refactor GameView** (à faire)
5. **Ajouter tests** (à faire)

---

## Conclusion

Le projet a une bonne base architecturale mais souffre de:

- **Duplication de code** (CharacterCreator variants)
- **Code mort** (composants inutilisés)
- **Manque de typage** (trop d'`any`)
- **État global absent** (prop drilling)
- **GameView surchargé** (290 lignes)

Avec les refactors P1 recommandés, le code sera bien plus maintenable et extensible. 🚀
