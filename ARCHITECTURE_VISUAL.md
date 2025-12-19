# 🗺️ Architecture Visuelle - Système de Voies

## Flux Global

```
┌────────────────────────────────────────────────────────────────┐
│                     NOUVEAU SYSTÈME (APRÈS)                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CHARACTER CREATION (4 steps)                               │
│     ├─ Step 1: Nom + Genre                                    │
│     ├─ Step 2: CLASSE (3 cartes: Guerrier|Rogue|Mage) ⭐      │
│     ├─ Step 3: Inventaire (AUTO par classe) ⭐                │
│     └─ Step 4: Avatar                                          │
│                                                                 │
│  2. IN-GAME PROGRESSION                                        │
│     ├─ Level-up                                               │
│     │  ├─ +1 HP (selon classe)                                │
│     │  └─ +1 Talent Point (ou +2 à certain levels)            │
│     │                                                          │
│     └─ Talent Point Spending                                  │
│        ├─ Débloquer Voie (rank 1)                            │
│        │  └─ Accès première aptitude                         │
│        │                                                       │
│        └─ Monter Rank (1→2, 2→3, etc.)                       │
│           └─ Coûte 1 point + prérequis                        │
│              └─ Accès nouvelle aptitude                        │
│                                                                 │
│  3. COMBAT                                                     │
│     ├─ Selection aptitude                                     │
│     │  ├─ Coût PA (cible: 1-5 PA)                            │
│     │  ├─ Range (1-8 cases)                                   │
│     │  ├─ Area (cercle, ligne)                                │
│     │  └─ Effect (damage, debuff, heal, etc.)                │
│     │                                                          │
│     ├─ Execution                                              │
│     │  ├─ Check PA sufficient                                │
│     │  ├─ Check cooldown                                      │
│     │  ├─ Apply scaling: 1+floor(level/5)                    │
│     │  ├─ Apply effect                                        │
│     │  └─ Reduce PA, start cooldown                          │
│     │                                                          │
│     └─ Reset (end of turn)                                    │
│        ├─ PA → max                                            │
│        ├─ PM → max                                            │
│        └─ Cooldowns -1                                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Hiérarchie Classes/Voies/Aptitudes

```
┌─ GUERRIER (HP+2, PA=6, PM=4)
│
├─ Voie: Lumière (Tank/Aura)
│  ├─ Rang 1: Aura Protectrice
│  ├─ Rang 2: Riposte Divine
│  ├─ Rang 3: Bouclier Sacré
│  ├─ Rang 4: Bénédiction
│  └─ Rang 5: Résurrection
│
├─ Voie: Sang (Berserk/Sacrifice)
│  ├─ Rang 1: Coup Sanglant
│  ├─ Rang 2: Fureur Sanglante
│  └─ ...
│
└─ Voie: Tactique (Commandant)
   └─ ...

┌─ ROGUE (HP+1, PA=5, PM=6)
│
├─ Voie: Ombre (Assassin/Poison)
│  └─ ...
│
├─ Voie: Nature (Traqueur)
│  └─ ...
│
└─ Voie: Charisme (Duelliste)
   └─ ...

┌─ MAGE (HP+0, PA=5, PM=7)
│
├─ Voie: Lumière (Prêtre/Heal)
│  └─ ...
│
├─ Voie: Abysse (Nécro/Invoc)
│  └─ ...
│
└─ Voie: Nature (Druide/AoE)
   └─ ...
```

---

## Data Model (MongoDB)

```
Character
├─ name, gender, portrait
├─ hp, hpMax
├─ level
├─ talentPointsByClass: [{className, points}]
├─ learnedAptitudes: [
│  { aptitudeId, learned_at_level, cooldown_remaining }
│  ]
│
└─ classes: [{
   name: "Guerrier",
   level: 5,
   voies: [{
      voieName: "Voie de la Lumière",
      currentRank: 2,
      unlockedAptitudes: ["aura-protectrice", "riposte-divine"]
   }]
}]

ClassDefinition
├─ name: "Guerrier"
├─ baseStats: {hp_base: 12, pa: 6, pm: 4}
└─ talentTrees: {
   "lumiere": {
     name: "Voie de la Lumière",
     ranks: [{
       rank: 1,
       aptitudeId: "aura-protectrice",
       pointCost: 1,
       requirements: {level: 1}
     }]
   }
}

Aptitude
├─ id: "aura-protectrice"
├─ name: "Aura Protectrice"
├─ cost_pa: 2
├─ cooldown: 2
├─ tactical: {
│  range: 4,
│  area: "cercle_4",
│  effect_type: "debuff_attack",
│  value: "1 + Math.floor(level / 5)"
│  }
└─ description_for_ai: "Un hurlement qui..."
```

---

## Flux API

```
┌─ Character Creation
│  ├─ POST /characters
│  │  body: {name, gender, world}
│  │
│  ├─ POST /characters/:id/select-class
│  │  body: {className: "Guerrier"}
│  │
│  └─ GET /characters/:id
│     → Character (avec class, starting inventory)

├─ In-Game Progression
│  ├─ POST /characters/:id/level-up
│  │  → character.level++, talentPoints++
│  │
│  ├─ GET /characters/:id/voies
│  │  → VoieProgressDto[]
│  │
│  └─ POST /characters/:id/unlock-rank
│     body: {voieName, newRank}
│     → consume talent point, unlock aptitudes

└─ Combat
   ├─ POST /combat/:characterId/start
   │  → InitCombat (roll initiative)
   │
   ├─ POST /combat/:characterId/action
   │  body: {aptitudeId, targetId}
   │  → Apply action, reduce PA, start cooldown
   │
   └─ GET /combat/:characterId/status
      → Current turn, PA/PM remaining, enemies HP
```

---

## Character Creation Flow (VISUAL)

```
┌──────────────────┐
│   STEP 1: INFO   │
│  Nom + Genre     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  STEP 2: CLASS   │  ← NOUVEAU (3 cartes)
│                  │
│ [Guerrier] [Rogue] [Mage]
│   +2 HP    +1 HP   +0 HP
│   6 PA     5 PA    5 PA
│   4 PM     6 PM    7 PM
│
└────────┬─────────┘
         │ (sélection auto-remplit inventaire)
         ▼
┌──────────────────┐
│ STEP 3: INVENTORY│  ← AUTO (pas de choix)
│                  │
│ Pack de départ   │
│ ☑ Épée longue   │
│ ☑ Chaîne de mail│
│ (tous disabled)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  STEP 4: AVATAR  │
│  Portrait        │
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │ FINISH! │
    └─────────┘
```

---

## StepClassSelection Component (Layout)

```
┌─────────────────────────────────────────────────────────┐
│ Choisissez votre classe                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │    ⚔️       │  │    🗡️       │  │    🔮      │   │
│  │  Guerrier   │  │    Rogue    │  │    Mage    │   │
│  │             │  │             │  │            │   │
│  │ Maître du   │  │ Finesse et  │  │ Puissance  │   │
│  │ combat      │  │ discrétion  │  │ magique    │   │
│  │             │  │             │  │            │   │
│  │ HP+2 PA=6PM=4    HP+1 PA=5PM=6    HP+0 PA=5PM=7  │
│  │             │  │             │  │            │   │
│  │ [Sélection] │  │ [Sélection] │  │ [Sélection]│   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Info Panel (si sélectionné)                            │
│                                                         │
│ Guerrier - Maître du combat rapproché...               │
│ HP: 12  PA: 6  PM: 4                                   │
│ Voies: Lumière, Sang, Tactique                         │
│                                                         │
│                          [Continuer →]                  │
└─────────────────────────────────────────────────────────┘
```

---

## Progression Timeline (Exemple Guerrier N1→N5)

```
LEVEL 1
├─ HP: 12, PA: 6, PM: 4
├─ Starting Aptitudes: [frappe-simple, parade]
├─ Talent Points: 1
└─ Can Unlock: Voie Lumière Rank 1 (1 point)

LEVEL 2
├─ HP: 19, PA: 6, PM: 4
├─ Talent Points: 0 (dépensé) + 1 (new) = 1
└─ Can Unlock: Voie Sang Rank 1 (1 point)

LEVEL 3
├─ HP: 26, PA: 6, PM: 4
├─ Talent Points: 1 (new)
├─ Voie Lumière Rank 1: aura-protectrice ✅
└─ Can Unlock: Voie Lumière Rank 2 (1 point) + riposte-divine

LEVEL 4
├─ HP: 33, PA: 6, PM: 4
├─ Talent Points: 1
├─ Scaling: 1 + floor(4/5) = 1
└─ Bonus HP gain important

LEVEL 5
├─ HP: 40, PA: 6, PM: 4
├─ Scaling: 1 + floor(5/5) = 2 ← Dégâts augmentent!
└─ Talent Points: 1
```

---

## Combat Action Sequence (Exemple)

```
┌─ Joueur a 6 PA, 4 PM (reset)
│
├─ Select aptitude: Aura Protectrice
│  ├─ Check: cost_pa 2 ≤ 6 PA ✅
│  ├─ Check: cooldown 0 ✅
│  ├─ Check: range 4 ≤ distance ✅
│  └─ Can execute ✅
│
├─ Apply effect:
│  ├─ value: "1 + floor(3/5)" = 1
│  ├─ Debuff all enemies in cercle_4: -1 attack
│  ├─ Duration: 2 turns
│  └─ animation: Draw aura circle
│
├─ Consume resource:
│  ├─ PA: 6 - 2 = 4 remaining
│  ├─ Cooldown: aura-protectrice → 2 turns
│  └─ PM: unchanged (0 movement)
│
└─ Next turn:
   ├─ PA reset → 6
   ├─ PM reset → 4
   ├─ Cooldowns -1 → aura-protectrice = 1
   └─ Ready for next action
```

---

## Suppression Code Mort (Visual)

```
BEFORE:
├─ dndLevelUpService.ts          ❌ DELETE
├─ dndRulesService.ts            ❌ DELETE (partially)
├─ StepAbilityScores.vue         ❌ DELETE
├─ StepSkills.vue                ❌ DELETE
├─ StepSpells.vue                ❌ DELETE
├─ StepCombat.vue                ❌ DELETE
├─ classes.service.ts (backend)  ❌ DELETE
├─ levelup.service.ts            ❌ DELETE
├─ spells.json                   📦 ARCHIVE
└─ levels.json (all classes)     📦 ARCHIVE

AFTER:
├─ talentTreeService.ts          ✨ NEW
├─ aptitude.service.ts           ✨ NEW
├─ progression.service.ts        ✨ NEW
├─ StepClassSelection.vue        ✨ NEW
├─ useClassSelection.ts          ✨ NEW
├─ useInventoryAutoAssign.ts     ✨ NEW
├─ aptitudes.json                ✨ NEW
├─ voies.json                    ✨ NEW
└─ progression.json              ✨ NEW
```

---

## Success Metrics

```
┌─────────────────────────┬──────────┬────────┐
│ Metric                  │ Before   │ After  │
├─────────────────────────┼──────────┼────────┤
│ Character Creation Steps│    7     │   4 ✅ │
│ Available Classes       │   12     │   3 ✅ │
│ D&D Code Lines          │  5000    │ 2000✅ │
│ Seed Entries            │  300+    │  150✅ │
│ Backend Services (D&D)  │    5     │   0✅ │
│ Complexity Level        │  HIGH    │ LOW ✅ │
│ User clicks (creation)  │    20    │   8✅ │
└─────────────────────────┴──────────┴────────┘
```

---

**Visual Version**: 1.0  
**Created**: 19 December 2025
