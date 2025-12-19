# ANALYSE : Migration vers Système de Voies (Talent Trees)

## 📋 Vue d'ensemble
Ce document analyse la transition du système D&D 5e vers un système **Chroniques Oubliées** simplifié avec Voies de Talent thématiques.

---

## 🎯 Philosophie du Nouveau Système

### Principes clés
- **3 Classes de base** : Guerrier, Rogue, Mage
- **Progression ouverte** : 3 Voies par classe × 5 Rangs = système flexible
- **Coût PA unifié** : Tous les pouvoirs coûtent des Points d'Action (pas de "slots de sorts")
- **Scaling automatique** : Dégâts/effets augmentent avec `level` (pas d'interventions manuelles)
- **Mobilité prioritaire** : Sorts de déplacement bon marché pour dynamiser la grille tactique

### Différences majeures par rapport à D&D 5e

| Aspect | D&D 5e Actuel | Nouveau Système |
|--------|---------------|-----------------|
| **Classes** | Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard | Guerrier, Rogue, Mage |
| **Progression** | 20 niveaux, slots de sorts par niveau | Points de Talent, Rangs (1-5) |
| **Coûts** | Slots de sorts, actions bonus | PA (Points d'Action) uniformes |
| **Scaling** | Bonus de Proficience, Ability Modifiers | Calcul auto : `1 + Math.floor(level / 5)` |
| **Sous-classes** | Choix au niveau 1-3 | Voies choisies indépendamment |
| **Multi-classing** | Tableau complexe | Multi-Voies libre |

---

## 📊 État Actuel du Codebase

### Structures existantes à remplacer/adapter

#### 1. **Schémas MongoDB** (infra/mongo/)
- `ClassDefinition.ts` ✅ Déjà préparé pour Voies
  - `name`: 'Guerrier', 'Rogue', 'Mage'
  - `baseStats`: {hp_base, pa, pm}
  - `talentTrees`: Map<string, TalentTree>
  - `startingAptitudes`: Liste d'IDs

- `TalentTree.ts` ✅ Structure existante
  - `name`: Voie (ex: "Voie de l'Ombre")
  - `ranks`: TalentRank[] (1-5)

- `TalentRank.ts` ✅ À confirmer
  - `rank`: 1-5
  - `aptitudeId`: Référence vers aptitudes
  - `pointCost`: Coût en points de talent (défaut 1)

- **À créer** : `Aptitude.ts` (remplace SpellDefinition)
  - `id`: identifiant unique ('foulée_ombreuse')
  - `name`: nom lisible
  - `cost_pa`: Coût en Points d'Action
  - `cooldown`: tours avant réutilisation
  - `tactical`: {range, area, effect_type, value}
  - `description_for_ai`: Pour la narration Gemini

#### 2. **Services actuels à refactoriser**

| Service | Rôle Actuel | Statut | À Modifier |
|---------|------------|--------|-----------|
| `classes.service.ts` | Gère D&D levels, ASI, proficiencies | ❌ Obsolète | **À remplacer** |
| `levelup.service.ts` | Applique gains de niveau D&D | ❌ Obsolète | **À remplacer** |
| `spell-definition.service.ts` | Gère SpellDefinition | ⚠️ Partiellement | **À adapter** → AptitudeService |
| `character.service.ts` | Gestion personnage | ✅ Réutiliser | Ajouter talent tree logic |

#### 3. **Character Schema** (infra/mongo/character/Character.ts)
Structure actuelle à adapter :
```typescript
// À supprimer ou adapter
classes: CharacterClass[];  // Remplacer par structure talent-basée
spells: Spell[];            // Remplacer par selectedAptitudes
selectedCombatProficiencies: string[];  // Peut rester mais resémanticiser

// À ajouter
talentPoints: number;              // Points de talent restants
learnedAptitudes: AptitudeInstance[]; // Aptitudes déverrouillées
takenVoies: {
  voieName: string;
  currentRank: number;  // 1-5
  unlockedAptitudes: string[];
}[]
```

#### 4. **DTOs Frontend/Backend** (domain/character/dto/)
| DTO Actuel | Rôle | Status |
|-----------|------|--------|
| `LevelUpOptionsDto` | Offres de niveau D&D | ❌ À remplacer |
| `SpellResponseDto` | Repose sur SpellDefinition | ⚠️ À adapter |
| `CharacterClassResponseDto` | Structure D&D | ❌ À remplacer |
| `CombatOptionDto` | Déjà OK pour tactique | ✅ Réutiliser |

Nouveaux DTOs à créer :
- `AptitudeDto`: {id, name, cost_pa, cooldown, tactical, description_for_ai}
- `VoieDto`: {name, ranks[], currentRank}
- `TalentProgressDto`: {voieId, currentRank, nextRankRequirements}

#### 5. **Seed Data**
| Fichier | Type | Action |
|---------|------|--------|
| `seed/spells.json` | Complet D&D | ⚠️ Nettoyer + réduire |
| `seed/classes/{class}/levels.json` | Par classe | ❌ À remplacer |
| `seed/classes/{class}/allowed-spells.full.json` | D&D spells | ❌ Remplacer par aptitudes |

---

## 🗂️ Structure des Données Cible

### ClassDefinition (Guerrier)
```json
{
  "name": "Guerrier",
  "baseStats": {
    "hp_base": 12,
    "pa": 6,
    "pm": 4
  },
  "proficiencies": ["vigueur", "armes"],
  "talentTrees": {
    "lumiere": {
      "name": "Voie de la Lumière",
      "description": "Tank, aura protectrice",
      "ranks": [
        { "rank": 1, "aptitudeId": "aura-protectrice", "pointCost": 1 },
        { "rank": 2, "aptitudeId": "riposte-divine", "pointCost": 2 },
        { "rank": 3, "aptitudeId": "bouclier-sacre", "pointCost": 3 },
        { "rank": 4, "aptitudeId": "benediction", "pointCost": 4 },
        { "rank": 5, "aptitudeId": "resurrection", "pointCost": 5 }
      ]
    },
    "sang": { /* Voie du Sang */ },
    "tactique": { /* Voie Tactique */ }
  },
  "startingAptitudes": ["frappe-simple", "parade"]
}
```

### Aptitude (remplace Spell)
```json
{
  "id": "cri-de-guerre",
  "name": "Cri de Guerre",
  "cost_pa": 2,
  "cooldown": 0,
  "tactical": {
    "range": 6,
    "area": "cercle_3",
    "effect_type": "debuff_attack",
    "value": "1 + Math.floor(level / 5)"
  },
  "description_for_ai": "Un hurlement terrifiant qui fait trembler les genoux des ennemis."
}
```

```typescript
// À ajouter dans tactical de Aptitude.ts
@Prop({ type: Object })
tactical: {
  range: number;
  area?: string;
  effect_type: 'damage' | 'heal' | 'buff' | 'move' | 'status'; 
  
  // Nouveaux champs pour Dash et Stealth
  move_type?: 'dash' | 'teleport' | 'swap'; // dash = glisse sur la grille, teleport = blink
  status_id?: 'invisible' | 'rooted' | 'shielded'; // Pour la furtivité
  ignore_tackle?: boolean; // Le dash ignore les zones de tacle (attaques d'opportunité)
  
  value?: string;
};
```

### Character Progression Data
```typescript
{
  characterId: "...",
  name: "Héros",
  classes: [{
    className: "Guerrier",
    level: 3,  // Niveau global du perso
    talentPoints: 4,  // Points non dépensés
    voies: [
      {
        voieName: "Lumière",
        currentRank: 2,  // Débloques rangs 1-2
        unlockedAptitudes: ["aura-protectrice", "riposte-divine"]
      },
      {
        voieName: "Sang",
        currentRank: 1,
        unlockedAptitudes: ["coup-sanglant"]
      }
    ]
  }],
  learnedAptitudes: [
    { aptitudeId: "frappe-simple", learned: true },
    { aptitudeId: "aura-protectrice", learned: true },
    { aptitudeId: "riposte-divine", learned: true },
    { aptitudeId: "coup-sanglant", learned: true },
    { aptitudeId: "parade", learned: true }
  ]
}
```

---

## 🔧 Plan d'Implémentation Détaillé

### Phase 1️⃣ : Schémas MongoDB et Services de Base
**Dépendances** : Aucune
**Fichiers à créer/modifier** :

1. **Créer** `apps/backend/src/infra/mongo/aptitude/Aptitude.ts`
   - Remplace `SpellDefinition` dans la logique tactique
   - Combine données tactiques + description AI

2. **Créer** `apps/backend/src/infra/mongo/class/AptitudeInstance.ts`
   - Enregistre si une aptitude est apprise par le perso
   - Métadonnées runtime (XP ganée, améliorations appliquées)

3. **Adapter** `ClassDefinition.ts`
   - Ajouter `description: string`
   - Ajouter `baseStatsProgression: {level: number, hp_gain: number}[]`
   - Valider structure `talentTrees` existante

4. **Adapter** `TalentRank.ts`
   - Ajouter `requirements?: {level?: number, prerequisiteAptitudes?: string[]}`
   - Valider `aptitudeId` est un string

5. **Modifier** `Character.ts`
   - Remplacer `spells: Spell[]` par `learnedAptitudes: AptitudeInstance[]`
   - Remplacer `classes: CharacterClass[]` par structure talent-based
   - Ajouter `talentPointsByClass: {className: string, points: number}[]`

### Phase 2️⃣ : Services (Business Logic)
**Dépendances** : Phase 1
**Fichiers à créer/modifier** :

1. **Créer** `apps/backend/src/domain/aptitude/aptitude.service.ts`
   - CRUD Aptitude
   - Valider structure tactique
   - Scaling automatique (formula resolver)

2. **Créer** `apps/backend/src/domain/talent-tree/talent-tree.service.ts`
   - Récupérer Voies pour une classe
   - Vérifier déverrouillage Rang (prérequis)
   - Calculer coût total points de talent

3. **Créer** `apps/backend/src/domain/character-progression/progression.service.ts`
   - Débloquer aptitude (perso apprend l'aptitude)
   - Progression Voie (monter rang, gagner aptitudes liées)
   - Récompenser points de talent (à chaque level-up)

4. **Remplacer** `classes.service.ts`
   - Au lieu de "D&D level up" → "Talent point reward"
   - Au lieu de "ASI" → "Voie rank unlock"
   - Garder calcul `calculateArmorClass()` existant

5. **Remplacer** `levelup.service.ts`
   - Appel à `progression.service` au lieu de la logique D&D

### Phase 3️⃣ : DTOs & Validation
**Dépendances** : Phases 1-2
**Fichiers à créer/modifier** :

1. **Créer** `AptitudeDto` (domain/aptitude/dto/)
   ```typescript
   export class AptitudeDto {
     id: string;
     name: string;
     cost_pa: number;
     cooldown: number;
     tactical: {range: number, area?: string, effect_type: string, value?: string};
     description_for_ai: string;
   }
   ```

2. **Créer** `VoieProgressDto` (domain/character/dto/)
   ```typescript
   export class VoieProgressDto {
     voieName: string;
     currentRank: number;  // 0-5 (0 = non débloquée)
     nextRankCost: number;
     unlockedAptitudes: string[];  // aptitudeIds
   }
   ```

3. **Créer** `TalentPointRewardDto` (domain/character/dto/)
   ```typescript
   export class TalentPointRewardDto {
     characterId: string;
     className: string;
     pointsEarned: number;
     totalAvailable: number;
   }
   ```

4. **Adapter** `LevelUpOptionsDto`
   - Remplacer `unlockedSpells` par `availableVoieRanks` et `availableAptitudes`
   - Ajouter `talentPointsGained`

5. **Adapter** `SpellResponseDto` → `AptitudeResponseDto`
   - Même structure + champs tactiques

### Phase 4️⃣ : Seed Data
**Dépendances** : Phases 1-3
**Fichiers à créer/modifier** :

1. **Créer** `apps/backend/seed/aptitudes.json`
   - ~80-120 aptitudes (au lieu de 300+ D&D spells)
   - Thème : Noms FR, méchaniques de mobilité
   - Structure Guerrier (Lumière/Sang/Tactique)
   - Structure Rogue (Ombre/Nature/Charisme)
   - Structure Mage (Lumière/Abysse/Nature)

2. **Créer** `apps/backend/seed/classes/guerrier/voies.json`
   ```json
   {
     "class": "Guerrier",
     "voies": [
       {
         "name": "Voie de la Lumière",
         "ranks": [
           { "rank": 1, "aptitudeId": "aura-protectrice" },
           // ...
         ]
       }
     ]
   }
   ```

3. **Remplacer** seed/classes/*/levels.json
   - Supprimer niveaux D&D
   - Créer fichier de reward : `{ level: 1, talentPoints: 1, hpGain: [12, 7, 6, 5, 4] }`

4. **Supprimer/Archiver**
   - `seed/spells.json` (garder backup)
   - `seed/classes/wizard/allowed-spells.full.json` (etc)

### Phase 5️⃣ : Endpoints API
**Dépendances** : Phases 1-4
**Fichiers à créer/modifier** :

1. **Adapters existants** (`controllers/character.controller.ts`)
   ```typescript
   // Remplacer
   @Post(':characterId/level-up')
   levelUp(characterId, dto) { }

   // Par
   @Post(':characterId/talent-points')
   spendTalentPoints(characterId, dto: SpendTalentPointsDto) { }
   // dto: { voieName, newRank } ou { aptitudeId }
   ```

2. **Nouveaux endpoints**
   ```typescript
   @Get(':characterId/voies')
   getVoieProgress(characterId): VoieProgressDto[]

   @Get(':characterId/aptitudes')
   getLearnedAptitudes(characterId): AptitudeResponseDto[]

   @Post(':characterId/unlock-rank')
   unlockVoieRank(characterId, dto: UnlockRankDto): CharacterResponseDto
   // Valide coûts points de talent, déverrouille aptitudes liées
   ```

3. **Combat endpoints** (adapts existants)
   - `POST /combat/action` accepte `aptitudeId` + cible (pas `expr`/`dices`)
   - Valide `cost_pa` <= `character.pa_remaining`
   - Applique cooldown

### Phase 6️⃣ : Character Creation Refactoring
**Dépendances** : Phases 1-5 (DTOs, endpoints)
**Objectif** : Transformer la création en flux simplifié (classe → inventaire auto)
**Fichiers à créer/modifier** :

#### A. Structure du Wizard
1. **Adapter** `CharacterCreatorWizard.vue`
   - **Nouveau flux** : BasicInfo → ClassSelection → Avatar (3 steps - NO manual inventory selection)
   - Ancien : BasicInfo → AbilityScores → Skills → Spells → Combat → Inventory → Avatar (7 steps)
   - Supprimer steps : AbilityScores, Skills, Spells, Combat, **Inventory (auto-assigned now)**
   - Inventory est assigné **automatiquement** lors de la sélection de classe

2. **Remplacer** `StepBasicInfo.vue`
   - Garder : Nom, Genre
   - **Supprimer** : Race (non nécessaire dans le nouveau système, peut revenir plus tard)

#### B. Sélection de Classe (Nouvelle étape)
3. **Créer** `StepClassSelection.vue`
   - **Visuel prominent** : 3 cartes visuelles (Guerrier/Rogue/Mage)
     - Placeholder image pour chaque classe (ex: `assets/classes/guerrier.jpg`)
     - Titre + thème court
     - Stats de base en badge (HP+2, PA=6, PM=4)
     - Description courte (2 lignes)
     - Bouton CTA "Choisir"
   - À la sélection : 
     - Sauvegarde `classes[0]` avec `name` et `level=1`
     - Appelle API pour pré-calculer `talentPoints`
     - Navigue automatiquement vers inventaire

4. **Classes Card Template**
   ```vue
   <div class="class-card cursor-pointer hover:scale-105 transition">
     <img :src="classImage" class="h-48 object-cover rounded-t" />
     <div class="p-4 bg-slate-900">
       <h3>{{ className }}</h3>
       <p class="text-sm text-slate-300">{{ description }}</p>
       <div class="flex gap-2 mt-2">
         <badge>HP+2</badge>
         <badge>PA=6</badge>
         <badge>PM=4</badge>
       </div>
     </div>
   </div>
   ```

#### C. Inventaire Auto-Assigné (COMPLÈTEMENT AUTOMATIQUE)
5. **❌ SUPPRIMER** `StepInventory.vue` - N'existe plus!
   - L'inventaire est maintenant assigné par le backend lors du clic sur une classe
   - Aucune étape visuelle pour la sélection manuelle d'inventaire
   - Le wizard passe directement de ClassSelection → Avatar
   - Backend assigne automatiquement :\n     - Guerrier → {Épée Longue de Garde +1 Vigor, Cotte de Mailles -1 PM, Flasque de Vigueur}
     - Rogue → {Dagues Jumelles +1 Finesse, Plastron de Cuir +1 PM, Fumigène}
     - Mage → {Bâton en Bois de Fer +1 Mind, Robe d'Apprenti +1 PA, Élixir de Lucidité}
   - Stats sont calculées automatiquement avec les bonus d'équipement

#### D. Nettoyage du Code
6. **Supprimer** composants obsolètes :
   - `StepAbilityScores.vue` (unused)
   - `StepSkills.vue` (unused)
   - `StepSpells.vue` (replaced by talent tree post-creation)
   - `StepCombat.vue` (unused in creation)
   - `StepInventory.vue` (❌ INVENTORY IS NOW AUTO-ASSIGNED)
   - `dndLevelUpService.ts` (frontend, obsolete)
   - `dndRulesService.ts` (config D&D, partiellement obsolete)

7. **Supprimer DTOs/types obsolètes** :
   - `AbilityScoresResponseDto` (si uniquement utilisé en creation)
   - `SkillResponseDto` (si uniquement utilisé en creation)
   - `LevelUpOptionsDto` → remplacer par `TalentProgressDto` (backend)

#### E. Tests & Composables
8. **Adapter** `useCharacter()` composable
   - Ajouter mutation `selectClass(className: string): Promise<Character>`
   - Valider que classe existe

9. **Adapter** `useCurrentCharacter()` composable
   - Ajouter computed `isClassSelected: boolean`
   - Retourner classe courante ou undefined

10. **Créer** `useClassSelection.ts` composable
    - `selectedClass: Ref<string | null>`
    - `classOptions: ComputedRef<ClassMetadata[]>` (depuis API ou config)
    - `selectClass(name): Promise<void>`
    - `isSelected(name): boolean`

11. **Mettre à jour tests**
    - `CharacterCreatorWizard.test.ts` : 3 steps au lieu de 7
    - Créer `StepClassSelection.test.ts` : vérifier sélection classe et auto-assignment
    - ❌ Supprimer `StepInventory.test.ts` : inventory n'existe plus
    - Supprimer tests pour steps supprimées

#### F. Données Statiques Frontend
12. **Créer** `src/data/classes.ts`
    ```typescript
    export const CLASS_METADATA = {
      guerrier: {
        name: 'Guerrier',
        description: 'Maître du combat rapproché. Protection, auras, attaques puissantes.',
        baseStats: { hp: 12, pa: 6, pm: 4 },
        image: '/assets/classes/guerrier.jpg',
        color: 'amber', // pour styling
      },
      rogue: {
        name: 'Rogue',
        description: 'Finesse et discrétion. Dégâts critiques, mobilité, poison.',
        baseStats: { hp: 10, pa: 5, pm: 6 },
        image: '/assets/classes/rogue.jpg',
        color: 'slate',
      },
      mage: {
        name: 'Mage',
        description: 'Puissance magique. AoE, contrôle, soins, invocations.',
        baseStats: { hp: 8, pa: 5, pm: 7 },
        image: '/assets/classes/mage.jpg',
        color: 'purple',
      },
    };
    ```

---

### Phase 7️⃣ : Frontend Talent Tree System
**Dépendances** : Phases 1-6
**Fichiers à créer/modifier** :

1. **Créer** `StepVoieSelection.vue` (post-creation, dans game)
   - Affiche grille Voies × Rangs
   - Clique sur Rang → dépense points de talent
   - Montre aptitudes déverrouillées pour chaque Voie
   - Validation : prérequis, points suffisants

2. **Créer** `VoieProgressPanel.vue`
   - Affiche Voie actuelle
   - Barre progression rang 1-5
   - Liste aptitudes débloquées

3. **Adapter** `useCombat.ts`
   - Affiche `cost_pa` au lieu de `spellSlots`
   - Valide PA disponibles

4. **Créer** `talentTreeService.ts` (frontend)
   - Logique d'unlock Voie/Rang
   - Validation coûts points de talent
   - Caching des données voies

---

## 📝 Détails des Voies par Classe

### 🗡️ GUERRIER
**Base Stats** : HP+2, PA=6, PM=4

| Voie | Thème | Rangs |
|------|-------|-------|
| **Lumière** | Tank/Aura | Aura Protectrice → Riposte Divine → Bouclier Sacré → Bénédiction → Résurrection |
| **Sang** | Berserk/Sacrifice | Coup Sanglant → Fureur Sanglante → Sacrifice → Vampirisme → Force Exsangue |
| **Tactique** | Commandant/Placement | Ordre de Bataille → Repositionnement Allié → Aura Tactique → Formation → Commandement Suprême |

### 🗡️ ROGUE
**Base Stats** : HP+1, PA=5, PM=6

| Voie | Thème | Rangs |
|------|-------|-------|
| **Ombre** | Assassin/Poison | Coup Fatal → Poison Paralysant → Écran de Fumée → Ombre Persistante → Assassin Fantôme |
| **Nature** | Traqueur/Familier | Piège → Familier → Piste → Meute → Maître de la Chasse |
| **Charisme** | Duelliste/Support | Parade Riposte → Désarmement → Charme → Démonstration → Duel Légendaire |

### 🔮 MAGE
**Base Stats** : HP+0, PA=5, PM=7

| Voie | Thème | Rangs |
|------|-------|-------|
| **Lumière** | Prêtre/Heal | Soins → Soins de Groupe → Résurrection → Aura de Vie → Régénération Passive |
| **Abysse** | Nécro/Invoc | Invocation → Contrôle Nécromancie → Contrôle de Foule → Armée des Morts → Pluie Maudite |
| **Nature** | Druide/AoE | Explosion Naturelle → Contrôle Environnement → Tempête → Transformation → Cataclysme |

---

## 🎮 Mécaniques de Combat (Impact PixiJS)

### Scénario exemple : Guerrier Lumière N3
```
// État
pa: 6 (reset/tour)
pm: 4 (reset/tour)
voies: { Lumière: rank 2 }
learnedAptitudes: [frappe-simple, aura-protectrice, riposte-divine, parade]

// Action possible : Aura Protectrice
aptitude: {
  id: "aura-protectrice",
  cost_pa: 2,
  cooldown: 2,  // Réutilisable après 2 tours
  effect: {
    range: 4,
    area: "cercle_4",
    value: "1 + Math.floor(3/5)" = 1  // À N3, 1 de réduction
  }
}

// Résolution
pa_spent: 2
pm_spent: 0 (aura, pas de mouvement)
cooldown_turns: 2
effect: Tous ennemis dans cercle 4 → -1 aux dégâts pendant 2 tours
```

### Action Queue (lisibilité AI)
```
Turn: Ennemi
  [Pause 1s] "Gobelin prépare une attaque..."
  [Pause 2s] "Gobelin avance vers vous..."
  [Pause 1s] "Gobelin attaque!"
  [Resolve] Dégâts appliqués
```

---

## 📋 Checklist d'Implémentation

### Phase 1: Schémas
- [ ] Créer `Aptitude.ts`
- [ ] Créer `AptitudeInstance.ts`
- [ ] Adapter `ClassDefinition.ts`
- [ ] Adapter `TalentRank.ts`
- [ ] Adapter `Character.ts`
- [ ] Exporter depuis `infra/mongo/index.ts`

### Phase 2: Services
- [ ] Créer `aptitude.service.ts`
- [ ] Créer `talent-tree.service.ts`
- [ ] Créer `progression.service.ts`
- [ ] Remplacer `classes.service.ts`
- [ ] Remplacer `levelup.service.ts`

### Phase 3: DTOs
- [ ] Créer `AptitudeDto`
- [ ] Créer `VoieProgressDto`
- [ ] Créer `TalentPointRewardDto`
- [ ] Adapter `LevelUpOptionsDto` → `TalentProgressDto`
- [ ] Créer `UnlockRankDto`

### Phase 4: Seed
- [ ] Créer `aptitudes.json` (Guerrier)
- [ ] Créer `aptitudes.json` (Rogue)
- [ ] Créer `aptitudes.json` (Mage)
- [ ] Créer `voies.json` pour chaque classe
- [ ] Créer `progression.json` (level → talent points)

### Phase 5: API
- [ ] Adapter `GET /characters/:id/voies`
- [ ] Créer `GET /characters/:id/aptitudes`
- [ ] Créer `POST /characters/:id/unlock-rank`
- [ ] Adapter `POST /characters/:id/level-up`
- [ ] Adapter endpoints combat

### Phase 6: Character Creation Refactoring
- [ ] Adapter `CharacterCreatorWizard.vue` (4 steps)
- [ ] Adapter `StepBasicInfo.vue` (nom + genre only)
- [ ] **Créer** `StepClassSelection.vue` (3 cartes visuelles)
- [ ] Adapter `StepInventory.vue` (inventaire automatique par classe)
- [ ] Supprimer `StepAbilityScores.vue`
- [ ] Supprimer `StepSkills.vue`
- [ ] Supprimer `StepSpells.vue`
- [ ] Supprimer `StepCombat.vue`
- [ ] Créer `useClassSelection.ts` composable
- [ ] Adapter `useCharacter.ts` composable (add selectClass)
- [ ] Adapter `useCurrentCharacter.ts` (add isClassSelected)
- [ ] Créer `src/data/classes.ts` (metadonnées classes)
- [ ] Supprimer `dndLevelUpService.ts`
- [ ] Supprimer obsolète `dndRulesService.ts` (ou nettoyer)
- [ ] Supprimer DTOs obsolètes
- [ ] Mettre à jour `CharacterCreatorWizard.test.ts`
- [ ] Créer `StepClassSelection.test.ts`
- [ ] Adapter `StepInventory.test.ts`

### Phase 7: Frontend Talent Tree System (Post-Creation)
- [ ] Créer `StepVoieSelection.vue` (grille Voies × Rangs)
- [ ] Créer `VoieProgressPanel.vue`
- [ ] Adapter `useCombat.ts`
- [ ] Créer `talentTreeService.ts`

### Phase 8: Tests & QA
- [ ] Tests unitaires services (aptitude, progression)
- [ ] Tests intégration API (unlock rank, spend points)
- [ ] Tests E2E character creation (class selection + inventory)
- [ ] Tests combat (PA/PM cost validation)
- [ ] Tests talent tree (unlock voie, rank progression)

---

## 🚀 Points d'Entrée pour Coding Agent

### Ordre recommandé :
1. **Phase 1** (Schémas) - Fondation
2. **Phase 4** (Seed) - Données de test
3. **Phase 2** (Services) - Logique
4. **Phase 3** (DTOs) - Contrats API
5. **Phase 5** (Endpoints) - Exposition
6. **Phase 6** (Character Creation) - UX simplifiée ⭐
7. **Phase 7** (Talent Trees) - Post-creation progression
8. **Phase 8** (Tests) - QA complet

### Dépendances critiques :
- ✅ `Aptitude.ts` AVANT `progression.service.ts`
- ✅ `progression.service.ts` AVANT endpoints
- ✅ `aptitudes.json` AVANT tests intégration
- ✅ Phase 5 (API endpoints) AVANT Phase 6 (Character Creation)
- ✅ Phase 6 (Class Selection) AVANT utilisation en création

### Suppression de Code Mort (à faire en Phase 6)
```
❌ À supprimer COMPLÈTEMENT
  - apps/frontend/src/components/character-creation/steps/StepAbilityScores.vue
  - apps/frontend/src/components/character-creation/steps/StepSkills.vue
  - apps/frontend/src/components/character-creation/steps/StepSpells.vue
  - apps/frontend/src/components/character-creation/steps/StepCombat.vue
  - apps/frontend/src/services/dndLevelUpService.ts
  - apps/frontend/src/services/dndRulesService.ts (partiellement)

❌ À archiver (ne pas supprimer, juste tag comme "deprecated")
  - apps/backend/seed/spells.json (guarder backup, mais ne pas utiliser)
  - apps/backend/src/seed/classes/*/levels.json
  - apps/backend/src/infra/mongo/spell/SpellDefinition.ts (si pas utilisé en combat)
```

---

## 🧪 Exemple Seed: Guerrier - Voie de la Lumière

```json
{
  "voieName": "Voie de la Lumière",
  "description": "Protection, auras divines, résilience",
  "ranks": [
    {
      "rank": 1,
      "aptitudeId": "aura-protectrice",
      "pointCost": 1,
      "requirements": { "level": 1 }
    },
    {
      "rank": 2,
      "aptitudeId": "riposte-divine",
      "pointCost": 2,
      "requirements": { 
        "level": 3,
        "prerequisiteAptitudes": ["aura-protectrice"]
      }
    },
    {
      "rank": 3,
      "aptitudeId": "bouclier-sacre",
      "pointCost": 3,
      "requirements": {
        "level": 5,
        "prerequisiteAptitudes": ["riposte-divine"]
      }
    },
    // ...rank 4-5
  ]
}
```

---

## 🎨 StepClassSelection.vue - Design Détaillé

### Template Structure
```vue
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold">Choisissez votre classe</h2>
    <p class="text-slate-400">Sélectionnez parmi les trois classes disponibles</p>

    <!-- Grid de 3 cartes -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ClassCard
        v-for="classEntry in CLASSES"
        :key="classEntry.id"
        :class-data="classEntry"
        :is-selected="selectedClass === classEntry.id"
        @select="selectClass(classEntry.id)"
      />
    </div>

    <!-- Info panel pour la classe sélectionnée -->
    <div v-if="selectedClass" class="bg-slate-900 p-4 rounded border border-slate-700">
      <h3 class="font-semibold mb-2">{{ selectedClassData?.name }}</h3>
      <p class="text-slate-300 text-sm mb-4">{{ selectedClassData?.fullDescription }}</p>
      <div class="flex gap-4 text-sm">
        <div><span class="text-slate-400">HP de base:</span> <span class="font-bold">{{ selectedClassData?.baseStats.hp }}</span></div>
        <div><span class="text-slate-400">PA:</span> <span class="font-bold">{{ selectedClassData?.baseStats.pa }}</span></div>
        <div><span class="text-slate-400">PM:</span> <span class="font-bold">{{ selectedClassData?.baseStats.pm }}</span></div>
      </div>
    </div>

    <!-- Confirm button -->
    <div v-if="selectedClass" class="flex justify-end">
      <button
        @click="confirmSelection"
        class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
      >
        Confirmer et continuer
      </button>
    </div>
  </div>
</template>
```

### ClassCard Component
```vue
<template>
  <div
    :class="[
      'class-card cursor-pointer rounded-lg overflow-hidden transition-all duration-300',
      'hover:scale-105 hover:shadow-xl',
      isSelected ? 'ring-2 ring-indigo-500 scale-105' : '',
    ]"
    @click="$emit('select')"
  >
    <!-- Image placeholder -->
    <div class="relative h-56 bg-gradient-to-b overflow-hidden" :class="`from-${colorClass}-900 to-${colorClass}-950`">
      <img
        v-if="classData.image"
        :src="classData.image"
        :alt="classData.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-6xl">
        {{ classData.icon }}
      </div>
      
      <!-- Overlay gradient -->
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      
      <!-- Selected badge -->
      <div v-if="isSelected" class="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold">
        ✓ Sélectionné
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 bg-slate-900 border-t border-slate-700">
      <h3 class="text-lg font-bold mb-2">{{ classData.name }}</h3>
      <p class="text-sm text-slate-300 mb-3">{{ classData.description }}</p>

      <!-- Stats badges -->
      <div class="flex gap-2 flex-wrap">
        <badge class="bg-red-900 text-red-200">
          <span class="font-bold">{{ classData.baseStats.hp }}</span> HP
        </badge>
        <badge class="bg-blue-900 text-blue-200">
          <span class="font-bold">{{ classData.baseStats.pa }}</span> PA
        </badge>
        <badge class="bg-green-900 text-green-200">
          <span class="font-bold">{{ classData.baseStats.pm }}</span> PM
        </badge>
      </div>

      <!-- Voies preview -->
      <div class="mt-3 pt-3 border-t border-slate-700">
        <p class="text-xs text-slate-400 mb-2">Voies disponibles:</p>
        <div class="flex gap-1 flex-wrap">
          <span v-for="voie in classData.voies" :key="voie" class="text-xs bg-slate-800 px-2 py-1 rounded">
            {{ voie }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  classData: ClassMetadata;
  isSelected: boolean;
}>();

defineEmits<{
  select: [];
}>();
</script>
```

### Script Setup
```typescript
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCharacter } from '@rpg-gen/api-client';
import { useCharacterId } from '@/composables/useCharacterId';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { CLASS_METADATA } from '@/data/classes';

const router = useRouter();
const characterId = useCharacterId();
const currentCharacter = useCurrentCharacter();
const { update } = useCharacter(characterId);

const selectedClass = ref<string | null>(null);

const CLASSES = computed(() =>
  Object.entries(CLASS_METADATA).map(([id, data]) => ({
    id,
    ...data,
  }))
);

const selectedClassData = computed(() => {
  if (!selectedClass.value) return null;
  return CLASS_METADATA[selectedClass.value];
});

const selectClass = async (classId: string) => {
  selectedClass.value = classId;
};

const confirmSelection = async () => {
  if (!selectedClass.value || !selectedClassData.value) return;

  try {
    // Sauvegarde la classe (utilise mutation selectClass de useCharacter)
    await update.mutateAsync({
      classes: [{
        name: selectedClassData.value.name,
        level: 1,
      }],
    });

    // Navigue vers l'étape suivante
    await router.push({ name: 'character-creation-step', params: { step: 'inventory' } });
  } catch (error) {
    console.error('Erreur lors de la sélection de classe:', error);
  }
};
```

---

## 🗂️ Data Structure: src/data/classes.ts (Complet)

```typescript
export interface ClassMetadata {
  name: string;
  description: string; // 1-2 lignes pour la carte
  fullDescription: string; // Plus long pour l'info panel
  icon: string; // Emoji ou placeholder
  image?: string; // URL vers image, ou vide pour emoji
  baseStats: {
    hp: number;
    pa: number;
    pm: number;
  };
  color: 'amber' | 'slate' | 'purple';
  voies: string[]; // ['Lumière', 'Sang', 'Tactique']
}

export const CLASS_METADATA: Record<string, ClassMetadata> = {
  guerrier: {
    name: 'Guerrier',
    description: 'Maître du combat rapproché. Protection, auras, attaques puissantes.',
    fullDescription: 'Les Guerriers excellent au combat rapproché et en protection. Dotés de HP élevés et de capacités d\'aura défensive, ils sont les piliers de l\'équipe. Choisissez entre trois voies: la Lumière (protection), le Sang (dégâts), ou la Tactique (support).',
    icon: '⚔️',
    image: '/assets/classes/guerrier.jpg', // ou undefined
    baseStats: { hp: 12, pa: 6, pm: 4 },
    color: 'amber',
    voies: ['Voie de la Lumière', 'Voie du Sang', 'Voie Tactique'],
  },
  rogue: {
    name: 'Rogue',
    description: 'Finesse et discrétion. Dégâts critiques, mobilité, poison.',
    fullDescription: 'Les Rogues se spécialisent dans l\'assassinat, la discrétion et la mobilité. Avec moins de HP mais plus de PM, ils excellent à esquiver et contre-attaquer. Trois voies les attendent: l\'Ombre (assassinat), la Nature (traqueur), ou le Charisme (duelliste).',
    icon: '🗡️',
    image: '/assets/classes/rogue.jpg',
    baseStats: { hp: 10, pa: 5, pm: 6 },
    color: 'slate',
    voies: ['Voie de l\'Ombre', 'Voie de la Nature', 'Voie du Charisme'],
  },
  mage: {
    name: 'Mage',
    description: 'Puissance magique. AoE, contrôle, soins, invocations.',
    fullDescription: 'Les Mages commandent la magie et les énergies primordiales. Fragiles en combat rapproché mais redoutables à distance, ils offrent AoE, contrôle et soins. Trois voies s\'offrent à eux: la Lumière (prêtre), l\'Abysse (nécro), ou la Nature (druide).',
    icon: '🔮',
    image: '/assets/classes/mage.jpg',
    baseStats: { hp: 8, pa: 5, pm: 7 },
    color: 'purple',
    voies: ['Voie de la Lumière', 'Voie de l\'Abysse', 'Voie de la Nature'],
  },
};
```

---

## ⚠️ Pièges à Éviter

1. **Casting de types** : Pas de `as` ou `as unknown as Type`
   - Utiliser guards/inférence TypeScript strict

2. **Multiples formes de payload**
   - Contrôleurs restent strictes sur shape des requêtes
   - Validation/normalisation en DTO/pipes, pas en contrôleur

3. **Spells vs Aptitudes**
   - Ancien : `SpellDefinition` reste si toujours référencé dans Combat
   - Nouveau : `Aptitude` pour tactique + narration
   - Migration progressive OK, mais clarifier split au départ

4. **MongooseSchema.Map**
   - `talentTrees: Map<string, TalentTree>` peut être tricky
   - Tester sérialisation/désérialisation

5. **Cooldown Tracking**
   - À stocker en `Character` : `aptitudeCooldowns: {aptitudeId: turnsRemaining}`
   - Pas dans `Aptitude` (données globales)

---

## 📚 Fichiers Clés à Consulter

### Structures existantes (bonnes références)
- [ClassDefinition.ts](apps/backend/src/infra/mongo/class/ClassDefinition.ts)
- [TalentTree.ts](apps/backend/src/infra/mongo/class/TalentTree.ts)
- [CombatOptionDto.ts](apps/backend/src/domain/character/dto/CombatOptionDto.ts)
- [combat.app.service.ts](apps/backend/src/domain/combat/combat.app.service.ts)

### Character Creation Frontend Actuelle
- [CharacterCreatorWizard.vue](apps/frontend/src/components/character-creation/CharacterCreatorWizard.vue)
- [StepBasicInfo.vue](apps/frontend/src/components/character-creation/steps/StepBasicInfo.vue)
- [StepInventory.vue](apps/frontend/src/components/character-creation/steps/StepInventory.vue)
- [StepAbilityScores.vue](apps/frontend/src/components/character-creation/steps/StepAbilityScores.vue) → **À SUPPRIMER**
- [StepSpells.vue](apps/frontend/src/components/character-creation/steps/StepSpells.vue) → **À SUPPRIMER**

### À remplacer (Backend)
- `apps/backend/src/domain/classes/classes.service.ts`
- `apps/backend/src/domain/character/levelup.service.ts`
- `apps/backend/src/infra/mongo/spell/SpellDefinition.ts` (si pas en combat)

### À remplacer (Frontend Services)
- `apps/frontend/src/services/dndLevelUpService.ts`
- `apps/frontend/src/services/dndRulesService.ts` (partiellement)

### Seed à archiver
- `apps/backend/seed/spells.json`
- `apps/backend/src/seed/classes/*/levels.json`
- `apps/backend/src/seed/classes/*/allowed-spells.full.json`

---

## 💾 Inventaires Automatiques par Classe

### Guerrier
```json
{
  "basePack": [
    { "name": "Chaîne de mail", "description": "Armure", "type": "armor" },
    { "name": "Pain et eau", "description": "Rations", "type": "consumable", "qty": 5 }
  ],
  "weapons": [
    { "name": "Épée longue", "description": "Arme de corps à corps puissante" },
    { "name": "Hache de guerre", "description": "Arme lourde à deux mains" }
  ]
}
```

### Rogue
```json
{
  "basePack": [
    { "name": "Armure de cuir", "description": "Légère et silencieuse", "type": "armor" },
    { "name": "Outils de crochetage", "description": "Pour crocheter les serrures", "type": "tool" },
    { "name": "Corde de soie", "description": "Cordage", "qty": 50 }
  ],
  "weapons": [
    { "name": "Dague", "description": "Arme légère et discrète" },
    { "name": "Épée courte", "description": "Arme de finesse" }
  ]
}
```

### Mage
```json
{
  "basePack": [
    { "name": "Robe de mage", "description": "Offre peu de protection mais aide à la concentration", "type": "armor" },
    { "name": "Grimoire vierge", "description": "Pour noter les formules", "type": "tool" },
    { "name": "Composantes", "description": "Encens, herbes, cristaux", "qty": 20 }
  ],
  "weapons": [
    { "name": "Bâton", "description": "Focalisateur de magie" },
    { "name": "Baguette", "description": "Focalisateur compact" }
  ]
}
```

---

---

## 📚 Documentation Complémentaire

Ce document est accompagné de 2 fichiers détaillés pour la Phase 6:

### 1. [DEAD_CODE_CLEANUP.md](DEAD_CODE_CLEANUP.md)
Catalogue complet du code mort à supprimer avec:
- Liste des 27 fichiers/composants à supprimer
- Ordre de suppression pour éviter breakage
- Scripts de vérification des imports
- Checklist finale

### 2. [STEPINVENTORY_REFACTOR.md](STEPINVENTORY_REFACTOR.md)
Refactoring détaillé de `StepInventory.vue` avec:
- Comportement cible (3 états)
- Mapping classe → inventaire automatique
- Code TypeScript complet
- Template Vue 3 final
- Données `STARTING_INVENTORY` par classe
- Tests Vitest
- Checklist d'intégration

### 3. [SYSTEM_OVERHAUL_ANALYSIS.md](SYSTEM_OVERHAUL_ANALYSIS.md) (ce fichier)
Vue d'ensemble globale: 8 phases, architecture, design patterns

---

## 🎬 Prochaine Étape

**Recommandation Immédiate** :
1. **Phase 1** (Schémas MongoDB) : Fondation structurelle
2. **Phase 6** (Character Creation) : Visibilité UX immédiate
   - Consulter: SYSTEM_OVERHAUL_ANALYSIS.md (Phase 6)
   - Consulter: STEPINVENTORY_REFACTOR.md (détails StepInventory)
   - Consulter: DEAD_CODE_CLEANUP.md (suppressions)
3. **Phase 4** (Seed) : Données pour tester l'ensemble

Cet ordre permet de voir les progrès visuels rapidement tout en construisant les bases robustes.

Souhaitez-vous commencer par une phase en particulier, ou implémenter le tout via un agent autonome? 🚀
