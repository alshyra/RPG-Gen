# Inventory System Update - Complete Auto-Assignment

**Date**: 19 décembre 2025  
**Status**: ✅ READY FOR IMPLEMENTATION  
**Impact**: SIGNIFICANT - 3-step wizard, complete backend auto-assignment

---

## Summary of Changes

### 🎯 Main Update
**Inventory is now 100% automatically assigned by the backend.**

Users NO LONGER manually select items during character creation.

### Wizard Reduction
```
OLD: 4 steps (BasicInfo → Class → Inventory Selection → Avatar)
NEW: 3 steps (BasicInfo → Class → Avatar)
```

---

## Documentation Updated

### ✨ New Document: INVENTORY_SYSTEM.md
Comprehensive guide covering:
- ItemDefinition schema (Mongoose)
- Starter packs for 3 classes (Guerrier, Rogue, Mage)
- Auto-assignment mechanism (backend assigns on class selection)
- `calculateCharacterStats()` function
- Frontend StepClassSelection.vue
- Backend services (InventoryService, CharacterService, StatsService)
- Complete code examples
- Tests

**700+ lines** of detailed implementation guide.

### 🔄 Updated Documents

#### SYSTEM_OVERHAUL_ANALYSIS.md
- **Phase 6** updated: 3 steps (not 4)
- No manual StepInventory
- Auto-assignment documented
- Starter pack assignments specified

#### STRUCTURE_CHECKLIST.md
- Removed: `StepInventory.vue`, `useInventoryAutoAssign.ts`, `inventory.ts`
- Added: `ItemDefinition` schema, `inventory.service.ts`, `items_seed.json`
- Test checklist updated (3 steps, not 4)
- Backend services clarified

#### DEAD_CODE_CLEANUP.md
- Added StepInventory.vue to deletion list
- Reason: "Inventory is NOW auto-assigned by backend"

#### README_DOCUMENTATION.md
- New entry for INVENTORY_SYSTEM.md
- STEPINVENTORY_REFACTOR.md marked DEPRECATED
- Navigation updated

#### STEPINVENTORY_REFACTOR.md
- Replaced with redirect to INVENTORY_SYSTEM.md
- Marked as OBSOLETE

---

## Starter Packs (Auto-Assigned)

### Guerrier - L'Indestructible
```json
[
  {
    "itemId": "weapon_warrior_01",
    "name": "Épée Longue de Garde",
    "slot": "weapon",
    "bonuses": { "vigor": 1 },
    "tactical_effect": "Chance de parade"
  },
  {
    "itemId": "armor_warrior_01",
    "name": "Cotte de Mailles Lourde",
    "slot": "body",
    "bonuses": { "pm": -1 },
    "tactical_effect": "Réduction dégâts: 2"
  },
  {
    "itemId": "consumable_warrior_01",
    "name": "Flasque de Vigueur",
    "slot": "consumable",
    "effect": "restore_hp",
    "effectValue": 10
  }
]
```

### Rogue - L'Invisible
```json
[
  {
    "itemId": "weapon_rogue_01",
    "name": "Dagues Jumelles",
    "slot": "weapon",
    "bonuses": { "finesse": 1 }
  },
  {
    "itemId": "armor_rogue_01",
    "name": "Plastron de Cuir Souple",
    "slot": "body",
    "bonuses": { "pm": 1 }
  },
  {
    "itemId": "consumable_rogue_01",
    "name": "Fumigène",
    "slot": "consumable",
    "effect": "stealth_1_turn",
    "effectValue": 1
  }
]
```

### Mage - L'Éveillé
```json
[
  {
    "itemId": "weapon_mage_01",
    "name": "Bâton en Bois de Fer",
    "slot": "weapon",
    "bonuses": { "mind": 1 }
  },
  {
    "itemId": "armor_mage_01",
    "name": "Robe d'Apprenti",
    "slot": "body",
    "bonuses": { "pa": 1 }
  },
  {
    "itemId": "consumable_mage_01",
    "name": "Élixir de Lucidité",
    "slot": "consumable",
    "effect": "restore_pa",
    "effectValue": 2
  }
]
```

---

## Backend Flow

```typescript
// User clicks class card in StepClassSelection
POST /api/characters/{id}/select-class
{
  classId: "class_warrior"
}

// Backend:
// 1. Fetch starter pack for class_warrior
// 2. Assign inventory items
// 3. Calculate final stats (base + equipment bonuses)
// 4. Return complete character

Response:
{
  character: {
    id: "char_123",
    classId: "class_warrior",
    inventory: [
      { itemId: "weapon_warrior_01", ... },
      { itemId: "armor_warrior_01", ... },
      { itemId: "consumable_warrior_01", ... }
    ],
    stats: {
      hp: 14,   // 12 base + 2 from armor
      pa: 6,
      pm: 5,    // 6 base - 1 from heavy armor
      vigor: 11, // 10 base + 1 from weapon
      ...
    }
  }
}
```

---

## Frontend Flow

```vue
<!-- StepClassSelection.vue -->
<template>
  <div class="class-cards">
    <div v-for="cls in classes" @click="selectClass(cls.id)">
      <!-- Card: image, stats, name -->
    </div>
    
    <!-- Shows starter pack after selection -->
    <div v-if="selectedClass">
      ✅ Starter pack assigned:
      - Épée Longue de Garde
      - Cotte de Mailles Lourde
      - Flasque de Vigueur
    </div>
  </div>
</template>

<script>
const selectClass = async (classId) => {
  // Call backend API
  const response = await api.post(`/characters/${id}/select-class`, { classId });
  // Character now has inventory + stats
  character.value = response.character;
  emit('next'); // Move to Avatar selection
};
</script>
```

---

## Key Points for Implementation

### ✅ What's New
1. **ItemDefinition schema** - MongoDB model for equipment
2. **InventoryService** - Manages starter packs
3. **StatsService.calculateCharacterStats()** - Merges base + equipment
4. **3-step wizard** - No inventory selection UI

### ❌ What's Gone
1. StepInventory.vue component
2. Manual inventory selection UI
3. useInventoryAutoAssign composable
4. inventory.ts data file

### 🔄 What's Modified
1. StepClassSelection.vue - Now triggers backend assignment
2. CharacterCreatorWizard.vue - Only 3 steps
3. CharacterService.selectClass() - New endpoint

---

## Stats Calculation Example

```typescript
calculateCharacterStats(character):
  baseStats = { hp: 12, pa: 6, pm: 6, vigor: 10, finesse: 9, mind: 8, survival: 9 }
  levelBonus = 0 (level 1)
  equipmentBonus = {
    vigor: +1 (from Épée),
    pm: -1 (from Cotte),
  }
  
  RESULT: {
    hp: 12 + 0 + 0 = 12
    pa: 6 + 0 + 0 = 6
    pm: 6 + 0 - 1 = 5 ✓
    vigor: 10 + 0 + 1 = 11 ✓
    ...
  }
```

---

## Testing Checklist

- [ ] Backend: `inventory.service.getStarterPack()` returns correct items
- [ ] Backend: `stats.service.calculateCharacterStats()` includes equipment bonuses
- [ ] Backend: POST `/characters/{id}/select-class` assigns inventory
- [ ] Frontend: StepClassSelection displays 3 cards
- [ ] Frontend: Clicking card calls API
- [ ] Frontend: Starter pack items shown after selection
- [ ] Wizard: Only 3 steps in CharacterCreatorWizard
- [ ] E2E: Full character creation flow (INFO → CLASS → AVATAR)

---

## Files to Clean Up

```
DELETE:
  ❌ apps/frontend/src/components/character-creation/steps/StepInventory.vue
  ❌ apps/frontend/src/components/character-creation/steps/__tests__/StepInventory.test.ts
  ❌ apps/frontend/src/composables/useInventoryAutoAssign.ts

CREATE:
  ✨ apps/backend/src/domain/inventory/inventory.service.ts
  ✨ apps/backend/src/infra/mongo/item/ItemDefinition.ts
  ✨ apps/backend/src/seed/items_seed.json
  ✨ apps/backend/src/domain/character/stats.service.ts (enhanced)

MODIFY:
  🔄 apps/backend/src/domain/character/character.service.ts (selectClass endpoint)
  🔄 apps/frontend/src/components/character-creation/CharacterCreatorWizard.vue (3 steps)
  🔄 apps/frontend/src/components/character-creation/steps/StepClassSelection.vue (auto-assign)
```

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| **INVENTORY_SYSTEM.md** | Complete implementation guide - START HERE |
| **SYSTEM_OVERHAUL_ANALYSIS.md** | Overall plan (Phase 6 updated) |
| **STRUCTURE_CHECKLIST.md** | File paths and validation |
| **DEAD_CODE_CLEANUP.md** | Code to delete (includes StepInventory) |
| **README_DOCUMENTATION.md** | Navigation and references |

---

## Next Steps

1. ✅ **Documentation**: All 4 main docs updated
2. ⏳ **Implementation**: Start with INVENTORY_SYSTEM.md
   - Backend Phase 1-3: Schemas + DTOs
   - Backend Phase 4: Seed data (3 starter packs)
   - Backend Phase 5: API endpoints
   - Frontend Phase 6: StepClassSelection + 3-step wizard

3. ✅ **Architecture**: Auto-assignment reduces complexity

---

## Summary

**Inventory Selection Step is GONE.**  
**Backend Assigns Automatically.**  
**3-Step Wizard.**  
**Stats Calculated with Equipment Bonuses.**  
**Better UX for New Players.**

See [INVENTORY_SYSTEM.md](INVENTORY_SYSTEM.md) for complete implementation.
