# Architecture des Composables Frontend

Document d'analyse de l'architecture actuelle des composables Vue 3 (Composition API) du frontend RPG-Gen.

## Vue d'ensemble

Les composables sont organisés en 3 catégories distinctes :

1. **Composables Core** : Context et session du joueur
2. **Composables Métier** : Logique applicative spécifique  
3. **Utilitaires** : Helpers et services purs (non-composables)

---

## 📍 Composables Core (Context & Session)

### `useCharacterId()` 
**Périmètre** : Extraction du paramètre de route  
**Responsabilité** : Fournir l'ID du personnage courant via route.params  
**Dépendances** : Vue Router  
**Retour** : `Computed<string | undefined>`

```typescript
// Remplace : useCharacterStore().currentCharacterId
const characterId = useCharacterId();
```

**Portée** : Global - utilisé partout pour identifier le personnage actif

---

### `useCurrentCharacter()`
**Périmètre** : Accès au personnage courant via TanStack Query  
**Responsabilité** : 
- Récupérer les données du personnage depuis l'API
- Exposer le personnage comme Computed ref reactive
- Tracker les mises à jour et les chargements

**Dépendances** : `useCharacter` (api-client), `useCharacterId`  
**Retour** : `ComputedRef<CharacterResponseDto | undefined>`

```typescript
// Remplace : useCharacterStore().currentCharacter
const currentCharacter = useCurrentCharacter();
// Accès : currentCharacter.value?.spells, currentCharacter.value?.hp
```

**Portée** : Très utilisé - accès à la donnée centralisée du personnage en temps réel

---

## 🎮 Composables Métier

### `useCombat()`
**Périmètre** : Orchestration complète des actions de combat  
**Responsabilités** :
- Initier un combat via instruction d'IA
- Gérer les tours du joueur (endActivation)
- Exécuter les attaques avec animation
- Détecter la fin de combat
- Synchroniser les HP et XP
- Navigation et modales d'UI

**Dépendances** :
- `useCombatApi` (api-client) - requêtes HTTP
- `useCharacter` (api-client) - mise à jour stats
- `useRouter` - navigation
- `combatStore` - état persistant des logs
- `gameStore` - messages système
- `useCombatEngine` - animations PIXI
- `useCurrentCharacter` - données perso
- `useCharacterId` - identification

**Retour** : Objet avec méthodes
```typescript
{
  endActivation,
  initializeCombat,
  executeAttack,
  fleeCombat,
  checkCombatStatus,
  isCombatEndModalOpen,
  closeCombatEndModal
}
```

**Points clés** :
- Gère la transition combat_start → combat_arena → combat_end
- Synchronise HP après chaque tour ennemi
- Détecte fin de combat via watcher sur `combatApi.status.data.value?.combatEnd`
- Inligne toute la logique (pas de helpers séparés)

**Portée** : Combat uniquement

---

### `useCombatEngine()`
**Périmètre** : Contrôle du rendu visuel et interactions PIXI.js  
**Responsabilités** :
- Synchroniser l'état backend avec le rendu PIXI
- Gérer les événements d'interaction utilisateur (drag, click)
- Animer les attaques (dégâts, mouvement, mort)
- Replay des attaques ennemies avec animation
- Contrôler la saisie (freeze UI pendant replay = `isReplaying`)

**Dépendances** :
- `CombatAdapter` - transformation d'état
- `CombatArenaApi` - interface PIXI
- `useCombat` - logique métier
- `useCombatApi` (api-client) - état backend
- `combatStore` - logs d'attaque
- `useCurrentCharacter` - stats joueur

**Interface exposée** : `CombatArenaApi`
```typescript
interface CombatArenaApi {
  init(), createUnit(), clearAllUnits()
  updateUnitHealth(), moveUnitToGrid()
  setupDragEvents()
  on(), off(), emit() // Event system
  getContainer()
}
```

**Points clés** :
- Pattern de registration : `registerArena()` appelé par CombatPanel
- `isReplaying` flag pour freeze l'UI durant animations
- Convertit instruction d'IA en unités PIXI
- Double-binded avec backend via watchers

**Portée** : Combat (panel PIXI) uniquement

---

### `useGameSession()`
**Périmètre** : Gestion de la session de jeu et instructions d'IA  
**Responsabilités** :
- Charger le contexte de jeu initial (quêtes, perso, scénario)
- Parser les instructions reçues de l'IA (rolls, HP, XP, combat_start)
- Dispatcher les instructions aux composables appropriés
- Manager les transitions d'état de jeu

**Dépendances** :
- `useChat` (api-client) - historique messages
- `useCharacter` (api-client) - stats
- `useCombat` - combat flow
- `useGameRolls` - traitement des rolls
- `useRouter` - navigation
- `gameStore` - UI + messages

**Retour** : Objet avec méthodes
```typescript
{
  initialize,
  handleIncomingInstruction,
  formatMessageForHistory
}
```

**Points clés** :
- Détecte type d'instruction avec type guards (`isRollInstruction`, etc.)
- Appelle `useCombat.initializeCombat()` pour combat_start
- Gère retry sur erreurs Gemini API
- Conservation du message échoué pour rejouer

**Portée** : Session de jeu entière

---

### `useGameMessages()`
**Périmètre** : Traitement des réponses de chat et instructions  
**Responsabilités** :
- Envoyer messages à l'IA (useCombat + useCombatEngine)
- Parser la réponse narrative
- Extraire et dispatcher les instructions
- Gérer les erreurs de communication

**Dépendances** :
- `useChat` (api-client) - communication
- `useCharacter` (api-client) - données
- `useCombat` - delegation combat
- `gameStore` - UI state
- `useCurrentCharacter` - perso courant

**Retour** : Objet avec méthodes
```typescript
{
  sendMessage,
  processInstructions
}
```

**Points clés** :
- Defensive: normalise instructions en array
- Traite combatStart, roll, hp, xp instructions
- Gère retry sur erreur Gemini
- Affiche messages système pour feedback UI

**Portée** : Communication avec IA

---

### `useGameRolls()`
**Périmètre** : Traitement des jets de dés  
**Responsabilités** :
- Calculer résultats de jets (dés + bonus compétence)
- Construire vue de roll pour affichage
- Intégrer avec système de compétences D&D 5e
- Envoyer résultat à l'IA

**Dépendances** :
- `useChat` (api-client) - envoi résultat
- `useCharacterId` - identification
- `useCurrentCharacter` - stats (bonus)
- `getSkillBonus` (skillService) - calcul bonus
- `gameStore` - state modales

**Retour** : Objet avec méthodes
```typescript
{
  onDiceRolled,
  onRollApproved,
  getRollMetadata
}
```

**Points clés** :
- Calcule bonus depuis characterResponseDto.scores
- Gère advantage/disadvantage
- Construit `rollData` pour affichage modal

**Portée** : Rolls uniquement

---

### `useSpellManagement(characterId)`
**Périmètre** : Gestion des sorts du personnage  
**Responsabilités** :
- Apprendre de nouveaux sorts
- Oublier des sorts
- Synchroniser avec API

**Dépendances** :
- `useCharacter` (api-client) - mise à jour

**Retour** : Objet avec méthodes
```typescript
{
  learnSpell,
  forgetSpell
}
```

**Points clés** :
- Dédupe par definitionId avant ajout
- Append/filter sur array existant

**Portée** : Gestion personnage

---

### `useAbilityScores()`
**Périmètre** : Gestion des scores de capacité D&D 5e  
**Responsabilités** :
- Calculer points utilisés via Point Buy
- Valider modifications selon budget
- Formatter modificateurs (+X/-X)
- Différencier création vs level-up

**Dépendances** :
- `useCurrentCharacter` - données scores
- `dndRulesService` - constantes D&D

**Retour** : Objet avec computed + méthodes
```typescript
{
  characterScores,
  pointsUsed,
  formatMod,
  applyPointBuyChange
}
```

**Points clés** :
- COST table pour Point Buy (8→0pts, 18→19pts)
- Support budget par level-up (increments au-dessus score initial)
- Immuable (retourne nouvel objet)

**Portée** : Création + level-up personnage

---

## 🛠️ Utilitaires (Non-Composables)

### `skillsUtils.ts`
**Périmètre** : Logique de compétences pures  
**Responsabilité** : `computeUpdatedSkills(skill, existingSkills)`  
- Toggle proficiency d'une compétence
- Ajouter nouvelle compétence si absent
- Retourner nouvel array immutable

**Type** : Fonction pure (pas de state Vue)

---

### `usePortraits.ts`
**Périmètre** : Chargement et matching portraits d'ennemis  
**Responsabilité** :
- Charger manifest de portraits (/public/images/enemies/)
- Matcher meilleur portrait par slug du nom
- Fallback gracieux

**Export** : Fonctions (pas de composable)
```typescript
loadPortraitManifest()
pickBestPortrait(nameOrId)
getFallbackPortrait(nameOrId)
```

**Points clés** :
- Cache manifest en ref global
- Cherche .webp puis .png
- Slugify : "Goblin King" → "goblin-king"

---

## 🔄 Flux de Dépendances

```
┌─ useCharacterId() ─────┐
│                         ├─ useCurrentCharacter()
│                         │
└─ useRoute()          ──┘
                          │
                    ┌─────▼────────┬────────────────┐
                    │              │                │
            useCharacter()    useCombat()    useGameMessages()
            (api-client)           │                │
                                   ├─────────┬─────┴──────┐
                                   │         │            │
                              useCombatApi  useCombatEngine  useChat()
                              (api-client)       │         (api-client)
                                                 │
                                          ┌──────▼──────┐
                                          │ CombatStore │
                                          └─────────────┘
```

### Hiérarchie de composables

**Niveau 1 (Core)** : `useCharacterId`, `useCurrentCharacter`

**Niveau 2 (Métier)** : `useCombat`, `useCombatEngine`, `useGameMessages`, `useGameSession`, `useGameRolls`, `useSpellManagement`, `useAbilityScores`

**Niveau 3 (Utils)** : `skillsUtils`, `usePortraits`

---

## 📋 Patterns & Conventions

### Computed Refs (liveness)
Les composables retournent `Computed` refs, pas des valeurs primitives. Permet tracking réactif automatique :
```typescript
const characterId = useCharacterId(); // Computed<string>
const currentCharacter = useCurrentCharacter(); // ComputedRef<CharacterDto>
```

### Direct API Client Access
Pas de wrapper—les composables appellent directement `@rpg-gen/api-client` (TanStack Query) :
```typescript
const combatApi = useCombatApi(characterId);
await combatApi.attack.mutateAsync({...});
combatApi.status.data.value // state reactif
```

### Inlining (Flatten Helpers)
Depuis le nettoyage récent, les petites functions helper sont inlinées pour éviter over-abstraction :
- ❌ ~~startCombat()~~ wrapper
- ✅ combatApi.startCombat.mutateAsync() direct

### Store Refs (via storeToRefs)
État UI persistant via Pinia (modales, logs, messages) :
```typescript
const combatStore = useCombatStore();
const { currentAttackView, isCombatEndModalOpen } = storeToRefs(combatStore);
```

### Watchers pour Side Effects
Détection état backend → action UI :
```typescript
watch(
  () => combatApi.status.data.value?.combatEnd,
  async combatEnd => { if (combatEnd) handleCombatEnd(); }
);
```

---

## 🚨 Problèmes Actuels & Notes

### Parfois Mélangé
- `useCombat` : Fait orchestration + messages système + navigation (big composable)
- `useCombatEngine` : Gère rendu + interactions + watchers complexes

**Possibilité refactor futur** : Scinder `useCombat` en `useCombatOrchestration` + `useCombatFeedback`

### API Client Abstraction Mince
Les DTOs générés (`CombatStateDto`, `CharacterResponseDto`, etc.) manquent de types stricts pour les instructions imbriquées (rolls, combat_start). Type guards utilisés pour parser.

### Stale Props à Améliorer
- `useCombatEngine.registerArena()` : Pattern registration à la main, pas idéal
- **Alternative future** : Provide/inject + ref reactif

---

## 📊 Responsabilités par Couche

| Couche | Responsabilité | Exemples |
|--------|---|---|
| **Core** | Context joueur, route, données brutes | `useCharacterId`, `useCurrentCharacter` |
| **Métier** | Logique applicative, workflows | `useCombat`, `useGameSession`, `useSpellManagement` |
| **Rendu** | PIXI, UI, animations | `useCombatEngine` |
| **Comms** | Chat, rolls, instructions | `useGameMessages`, `useGameRolls` |
| **Utils** | Calculs purs, helpers | `skillsUtils`, `usePortraits` |

---

## 🎯 Bonnes Pratiques Actuelles

✅ **À Respecter** :
- Composables = logique réutilisable uniquement
- DTOs + type guards pour validation
- Eviter `as` casting (strict TypeScript)
- Direct API client access (pas de wrapper)
- Inlining des micro-helpers
- Computed refs pour liveness

✅ **Patterns à Suivre** :
- `useCharacterId()` → `characterId.value` 
- `useCurrentCharacter()` → `currentCharacter.value?.field`
- `useCombat()` pour workflows métier
- Watchers pour détection état backend
- StoreToRefs pour persistent state

---

## 📌 Où Ajouter Nouveau Code

| Besoin | Où ? | Exemple |
|--------|------|---------|
| État joueur courant | `useCurrentCharacter()` | HP, XP, spells |
| Action métier | Nouveau composable métier | `useInventoryManagement()` |
| Calcul pur D&D | Utils ou service | `calculateAC()` |
| Logique UI (modales, etc) | `combatStore` ou `gameStore` | `showRollModal` |
| Rendu / animation | `useCombatEngine` ou composable spécialisé | PIXI events |
| Appel API | Via composable métier + api-client | `useCombat.executeAttack()` |

