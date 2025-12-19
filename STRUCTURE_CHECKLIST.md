# 📁 Structure Cible Post-Refactoring

## Arborescence Cible (Fichiers modifiés/créés/supprimés)

### ✨ CRÉÉS

#### Backend

```
apps/backend/src/
├── infra/mongo/
│   ├── aptitude/
│   │   ├── Aptitude.ts                 ✨ NEW
│   │   └── AptitudeInstance.ts         ✨ NEW
│   └── class/
│       ├── index.ts                    🔄 MODIFIED (exports)
│       └── TalentRank.ts               🔄 MODIFIED (add requirements)
│
├── domain/
│   ├── aptitude/
│   │   ├── aptitude.service.ts         ✨ NEW
│   │   └── dto/
│   │       └── AptitudeDto.ts          ✨ NEW
│   │
│   ├── talent-tree/
│   │   ├── talent-tree.service.ts      ✨ NEW
│   │   └── dto/
│   │       └── VoieProgressDto.ts      ✨ NEW
│   │
│   └── character-progression/
│       ├── progression.service.ts      ✨ NEW
│       └── dto/
│           ├── TalentPointRewardDto.ts ✨ NEW
│           └── UnlockRankDto.ts        ✨ NEW
│
└── seed/
    ├── aptitudes.json                  ✨ NEW (Guerrier, Rogue, Mage)
    ├── voies/
    │   ├── guerrier.json               ✨ NEW
    │   ├── rogue.json                  ✨ NEW
    │   └── mage.json                   ✨ NEW
    └── progression.json                ✨ NEW (level → talent points)
```

#### Frontend

```
apps/frontend/src/
├── components/character-creation/steps/
│   ├── StepClassSelection.vue          ✨ NEW
│   ├── StepBasicInfo.vue               🔄 MODIFIED (remove race)
│   └── ❌ StepInventory.vue            ❌ DELETED (inventory is now auto-assigned)
│
├── composables/
│   ├── useClassSelection.ts            ✨ NEW
│   └── useCharacter.ts                 🔄 MODIFIED (add selectClass)
│
├── services/
│   └── talentTreeService.ts            ✨ NEW
│
└── data/
    └── classes.ts                      ✨ NEW (CLASS_METADATA)
```

---

### 🔄 MODIFIÉS

#### Backend

```
apps/backend/src/
├── infra/mongo/
│   ├── class/
│   │   ├── ClassDefinition.ts          🔄 MODIFIED
│   │   │   └── add: baseStatsProgression
│   │   │   └── add: description
│   │   │
│   │   └── TalentRank.ts
│   │       └── add: requirements field
│   │
│   └── character/
│       ├── Character.ts                🔄 MODIFIED
│       │   └── spells → learnedAptitudes
│       │   └── classes → new structure
│       │   └── add: talentPointsByClass
│       │
│       ├── AbilityScores.ts            ⚠️ REVIEW/ADAPT
│       ├── Skill.ts                    ⚠️ REVIEW/DELETE
│       └── CharacterClass.ts           🔄 MODIFIED (completely)
│
└── infra/mongo/index.ts                🔄 MODIFIED (exports)

apps/backend/src/domain/
├── character/
│   ├── character.service.ts            🔄 MODIFIED (talent logic)
│   └── dto/
│       ├── BaseCharacterResponseDto.ts 🔄 MODIFIED
│       ├── SpellResponseDto.ts         🔄 ADAPTED (or deprecated)
│       ├── AbilityScoresResponseDto.ts 📦 ARCHIVE
│       ├── SkillResponseDto.ts         📦 ARCHIVE
│       ├── CharacterClassResponseDto.ts 📦 ARCHIVE
│       └── LevelUpOptionsDto.ts        📦 DEPRECATE
│
└── combat/
    └── combat.app.service.ts           🔄 MODIFIED (PA instead of slots)

apps/backend/src/modules/
└── character.module.ts                 🔄 MODIFIED (add AptitudeModule)

apps/backend/src/controllers/
└── character.controller.ts             🔄 MODIFIED (endpoints)
```

#### Frontend

```
apps/frontend/src/
├── components/character-creation/
│   ├── CharacterCreatorWizard.vue      🔄 MODIFIED
│   │   └── 3 steps (was 7) - NO inventory selection
│   │
│   └── steps/
│       ├── StepBasicInfo.vue           🔄 MODIFIED (remove race)
│       ├── StepAvatar.vue              ✅ UNCHANGED
│       └── ❌ StepInventory.vue        ❌ DELETED
│
├── composables/
│   ├── useCurrentCharacter.ts          🔄 MODIFIED
│   │   └── add: isClassSelected computed
│   │
│   ├── useCharacter.ts                 🔄 MODIFIED
│   │   └── add: selectClass mutation
│   │
│   └── useCombat.ts                    🔄 MODIFIED
│       └── PA/PM instead of spell slots
│
└── services/
    └── dndRulesService.ts              🔄 MODIFIED
        └── keep: GENDERS
        └── remove: D&D specific
```

---

### ❌ SUPPRIMÉS

#### Backend

```
ARCHIVE (ne pas supprimer, juste renommer):
├── apps/backend/seed/spells.json → _DEPRECATED_spells.json
├── apps/backend/src/seed/classes/barbarian/levels.json → _DEPRECATED_
├── apps/backend/src/seed/classes/barbarian/allowed-spells.full.json → _DEPRECATED_
├── apps/backend/src/seed/classes/bard/... → _DEPRECATED_
├── apps/backend/src/seed/classes/cleric/... → _DEPRECATED_
├── apps/backend/src/seed/classes/druid/... → _DEPRECATED_
├── apps/backend/src/seed/classes/fighter/... → _DEPRECATED_
├── apps/backend/src/seed/classes/monk/... → _DEPRECATED_
├── apps/backend/src/seed/classes/paladin/... → _DEPRECATED_
├── apps/backend/src/seed/classes/ranger/... → _DEPRECATED_
├── apps/backend/src/seed/classes/rogue/levels.json → _DEPRECATED_
├── apps/backend/src/seed/classes/rogue/allowed-spells.full.json → _DEPRECATED_
├── apps/backend/src/seed/classes/sorcerer/... → _DEPRECATED_
├── apps/backend/src/seed/classes/warlock/... → _DEPRECATED_
└── apps/backend/src/seed/classes/wizard/levels.json → _DEPRECATED_

DELETE (si vraiment mort):
├── apps/backend/src/domain/classes/classes.service.ts ✂️
└── apps/backend/src/domain/character/levelup.service.ts ✂️
```

#### Frontend

```
DELETE IMMEDIATELY:
├── apps/frontend/src/components/character-creation/steps/StepAbilityScores.vue ✂️
├── apps/frontend/src/components/character-creation/steps/StepSkills.vue ✂️
├── apps/frontend/src/components/character-creation/steps/StepSpells.vue ✂️
├── apps/frontend/src/components/character-creation/steps/StepCombat.vue ✂️
├── apps/frontend/src/services/dndLevelUpService.ts ✂️
├── apps/frontend/src/services/__tests__/dndLevelUpService.test.ts ✂️
├── apps/frontend/src/components/character-creation/steps/__tests__/StepAbilityScores.test.ts ✂️
├── apps/frontend/src/components/character-creation/steps/__tests__/StepSkills.test.ts ✂️
├── apps/frontend/src/components/character-creation/steps/__tests__/StepSpells.test.ts ✂️
└── apps/frontend/src/components/character-creation/steps/__tests__/StepCombat.test.ts ✂️
```

---

## 🧪 Tests Impactés

### Frontend Tests

```
NOUVEAU:
├── __tests__/StepClassSelection.test.ts             ✨ NEW
├── __tests__/composables/useClassSelection.test.ts  ✨ NEW
└── __tests__/data/classes.test.ts                   ✨ NEW

ADAPTÉ:
├── __tests__/CharacterCreatorWizard.test.ts         🔄 MODIFIED
│   └── Test 3 steps (not 7)
│   └── Add assertions for StepClassSelection
│   └── Remove assertions for deleted steps
│
└── ❌ __tests__/StepInventory.test.ts               ❌ DELETED (inventory no longer manual)

SUPPRIMÉ:
├── __tests__/StepAbilityScores.test.ts              ✂️
├── __tests__/StepSkills.test.ts                     ✂️
├── __tests__/StepSpells.test.ts                     ✂️
├── __tests__/StepCombat.test.ts                     ✂️
└── __tests__/services/dndLevelUpService.test.ts     ✂️
```

### Backend Tests

```
NOUVEAU:
├── test/unit/domain/aptitude/aptitude.service.test.ts           ✨ NEW
├── test/unit/domain/talent-tree/talent-tree.service.test.ts     ✨ NEW
├── test/unit/domain/progression/progression.service.test.ts     ✨ NEW
├── test/integration/character-progression.test.ts               ✨ NEW
└── test/e2e/character-creation-flow.test.ts                     ✨ NEW

ADAPTÉ:
├── test/unit/domain/character/character.service.test.ts         🔄 MODIFIED
│   └── Test talent logic, not spell slots
│
└── test/integration/character-controller.test.ts                🔄 MODIFIED
    └── Test POST /characters/:id/unlock-rank
    └── Remove POST /characters/:id/level-up

SUPPRIMÉ:
├── test/unit/domain/classes/classes.service.test.ts             ✂️
└── test/unit/domain/character/levelup.service.test.ts           ✂️
```

---

## 🔌 API Endpoints Impactés

### ❌ À SUPPRIMER / REMPLACER

```http
DELETE:
  POST /characters/:id/level-up                (D&D 5e)
  GET /characters/:id/level-options            (D&D 5e)

REMPLACER PAR:
  POST /characters/:id/unlock-rank             (nouveau)
  GET /characters/:id/voies                    (nouveau)
  GET /characters/:id/aptitudes                (nouveau)
```

### ✨ NOUVEAUX

```http
POST /characters/:id/select-class
  body: { className: string }
  → attribue classe, initialise talentPoints

GET /characters/:id/voies
  → VoieProgressDto[]

POST /characters/:id/unlock-rank
  body: { voieName: string }
  → débloqueRank+1, consomme points de talent

GET /characters/:id/aptitudes
  → AptitudeResponseDto[] (learned)

POST /characters/:id/select-aptitude
  body: { aptitudeId: string }
  → ajoute aptitude aux learned (si déverrouillée)
```

### 🔄 MODIFIÉS (Combat)

```http
POST /combat/action
  OLD: { expr: "1d8+2" } ou { dices: {...} }
  NEW: { aptitudeId: string, targetId: string }
  
  Validation: aptitude exist? PA sufficient? Cooldown ok?
```

---

## 📦 Dependencies à Ajouter

### Backend (NestJS)
```json
{
  "dependencies": {
    // Probablement aucune nouvelle (NestJS couvre déjà)
  },
  "devDependencies": {
    // Tests avec ava (existing)
  }
}
```

### Frontend (Vue 3)
```json
{
  "dependencies": {
    // Probablement aucune nouvelle (déjà present)
  },
  "devDependencies": {
    // Tests avec Vitest (existing)
  }
}
```

**Pas de breaking changes de dépendances prévues.**

---

## 🔍 Validation Checklist

### Structure OK?
- [ ] `infra/mongo/aptitude/` créé avec Aptitude.ts
- [ ] `infra/mongo/class/TalentRank.ts` a field `requirements`
- [ ] `domain/aptitude/` créé avec service + dto
- [ ] `domain/talent-tree/` créé avec service + dto
- [ ] `domain/character-progression/` créé

### Frontend OK?
- [ ] `src/data/classes.ts` existe avec CLASS_METADATA
- [ ] `src/composables/useClassSelection.ts` créé
- [ ] `StepClassSelection.vue` créé et intégré
- [ ] `StepInventory.vue` supprimé (auto-assigned now)

### Backend OK?
- [ ] `inventory.service.ts` créé (getStarterPack)
- [ ] `ItemDefinition` schema créé
- [ ] `items_seed.json` créé avec 3 starter packs
- [ ] `character.service.selectClass()` assignes inventory automatiquement
- [ ] `stats.service.calculateCharacterStats()` merge base + equipment bonuses
- [ ] POST /characters/:id/select-class endpoint

### Cleanup OK?
- [ ] `StepAbilityScores.vue` supprimé
- [ ] `StepSkills.vue` supprimé
- [ ] `StepSpells.vue` supprimé
- [ ] `StepCombat.vue` supprimé
- [ ] `StepInventory.vue` supprimé (❌ inventory is auto-assigned)
- [ ] `dndLevelUpService.ts` supprimé
- [ ] `classes.service.ts` supprimé (backend)
- [ ] Aucun import vers files supprimés

### Tests OK?
- [ ] Tests pour StepClassSelection créés
- [ ] CharacterCreatorWizard.test.ts adapté (3 steps)
- [ ] Backend character.service tests créés
- [ ] Backend stats calculation tests créés
- [ ] CI passe sans erreur

### API OK?
- [ ] POST /characters/:id/select-class fonctionnel (assigne inventory + calcule stats)
- [ ] GET /characters/:id/voies fonctionnel
- [ ] POST /characters/:id/unlock-rank fonctionnel
- [ ] POST /combat/action accepte aptitudeId
- [ ] Vieux endpoints supprimés (ou deprecated)

### Seed OK?
- [ ] `seed/aptitudes.json` avec 80+ aptitudes
- [ ] `seed/voies/guerrier.json` complet
- [ ] `seed/voies/rogue.json` complet
- [ ] `seed/voies/mage.json` complet
- [ ] `seed/progression.json` pour level-up rewards

---

## 🔗 Links Croisés

| Document | Usage |
|----------|-------|
| [SYSTEM_OVERHAUL_ANALYSIS.md](SYSTEM_OVERHAUL_ANALYSIS.md) | Vue complète + détails par phase |
| [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) | Résumé exécutif + timeline |
| [DEAD_CODE_CLEANUP.md](DEAD_CODE_CLEANUP.md) | Liste précise du code à supprimer |
| [STEPINVENTORY_REFACTOR.md](STEPINVENTORY_REFACTOR.md) | Détails complets StepInventory |

---

## 📊 Métriques de Succès

```
BEFORE:
├── Character Creation Steps: 7
├── Available Classes: 12
├── Backend Services (D&D related): 5
├── Seed Files: 300+ JSON entries
├── Code lines (D&D logic): ~5000
└── Complexity: HIGH

AFTER:
├── Character Creation Steps: 4 ✅ 43% reduction
├── Available Classes: 3 ✅ 75% reduction
├── Backend Services (Talent related): 3 ✅ Streamlined
├── Seed Files: 150 JSON entries ✅ 50% reduction
├── Code lines (Talent logic): ~2000 ✅ 60% reduction
└── Complexity: LOW ✅ Much simpler
```

---

**Document généré**: 19 décembre 2025  
**Dernière mise à jour**: 19 décembre 2025
