# Inventory System - Auto-Assignment Architecture

**Status**: ✅ INVENTORY NOW AUTO-ASSIGNED BY BACKEND  
**Update**: 19 décembre 2025 - Removed manual inventory selection from wizard

## Overview

Inventory is **automatically assigned** when a character selects their class during character creation. The user no longer manually selects items. 

**Impact**: 4-step wizard → **3-step wizard**

## Character Creation Flow (3 Steps Only)

```
STEP 1: Character Info
  └─ User enters name and description
  
STEP 2: Class Selection ← 🎁 INVENTORY AUTO-ASSIGNED HERE
  └─ User picks from 3 visual class cards
  └─ Backend automatically assigns starter pack:
     • Weapon specific to class
     • Armor specific to class
     • Consumable starter item
  └─ Backend calculates final stats (base + equipment bonuses)
  
STEP 3: Avatar Selection
  └─ User picks portrait
  
✅ DONE → Character ready to fight with starter gear
```

## No Manual Inventory Selection

**This screen no longer exists in character creation.**

### Why Remove It?

- ✅ **Better UX**: New players don't understand items during onboarding
- ✅ **Balance Guaranteed**: Backend ensures fairness per class
- ✅ **Simplicity**: Reduces choices during creation
- ✅ **Consistency**: Equipment is identical for each class (fairness)
- ✅ **Speed**: Faster character creation flow

## Auto-Assignment Mechanism (Backend)

When user clicks a class card in `StepClassSelection`:

```typescript
// Frontend: packages/frontend/src/components/character-creation/steps/StepClassSelection.vue
const selectClass = async (classId: string) => {
  const response = await characterService.selectClass({
    characterId: currentCharacter.value.id,
    classId: classId,
  });
  
  // Backend response includes:
  // - character with class assigned
  // - inventory array pre-loaded with starter pack
  // - calculated stats (base + equipment bonuses)
  
  currentCharacter.value = response.character;
  // Inventory now available in currentCharacter.inventory ✅
};
```

## Backend Response Example

```json
{
  "character": {
    "id": "char_123",
    "name": "Aragorn",
    "classId": "class_warrior",
    "level": 1,
    "experience": 0,
    "inventory": [
      {
        "itemId": "weapon_warrior_01",
        "slot": "weapon",
        "name": "Épée Longue de Garde",
        "bonuses": { "vigor": 1 }
      },
      {
        "itemId": "armor_warrior_01",
        "slot": "body",
        "name": "Cotte de Mailles Lourde",
        "bonuses": { "pm": -1 },
        "tactical_effect": "Réduction dégâts: 2"
      },
      {
        "itemId": "consumable_warrior_01",
        "slot": "consumable",
        "name": "Flasque de Vigueur",
        "effect": "restore_hp",
        "effectValue": 10
      }
    ],
    "stats": {
      "hp": 14,
      "pa": 6,
      "pm": 5,
      "vigor": 11,
      "finesse": 9,
      "mind": 8,
      "survival": 9
    }
  }
}
```

---

# ItemDefinition Schema

## Mongoose Schema

```typescript
// apps/backend/src/infra/mongo/item/ItemDefinition.ts
import { Schema, Document } from 'mongoose';

export interface ItemDefinition extends Document {
  id: string;
  name: string;
  description: string;
  
  // Inventory slot
  slot: 'head' | 'body' | 'weapon' | 'accessory' | 'consumable';
  
  // Equipment bonuses (added to character stats)
  bonuses: {
    vigor?: number;
    finesse?: number;
    mind?: number;
    survival?: number;
    pa?: number;          // Points d'Action
    pm?: number;          // Points de Mouvement
    hp?: number;
  };
  
  // Special effect description
  tactical_effect?: string;     // e.g., "+1 portée", "discrétion améliorée"
  description_for_ai: string;   // Narrative description for Gemini
  
  // For consumable items
  effect?: string;              // e.g., "restore_hp", "restore_pa", "stealth"
  effectValue?: number;
}

const itemSchema = new Schema<ItemDefinition>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  slot: {
    type: String,
    enum: ['head', 'body', 'weapon', 'accessory', 'consumable'],
    required: true,
  },
  bonuses: {
    vigor: Number,
    finesse: Number,
    mind: Number,
    survival: Number,
    pa: Number,
    pm: Number,
    hp: Number,
  },
  tactical_effect: String,
  description_for_ai: { type: String, required: true },
  effect: String,
  effectValue: Number,
});

export const ItemDefinitionModel = mongoose.model('ItemDefinition', itemSchema);
```

---

# Starter Packs (Seed Data)

## Seed File: items_seed.json

```json
{
  "packs": {
    "class_warrior": {
      "name": "L'Indestructible",
      "description": "Équipement pour combattant robuste",
      "items": [
        {
          "id": "weapon_warrior_01",
          "name": "Épée Longue de Garde",
          "slot": "weapon",
          "bonuses": {
            "vigor": 1
          },
          "tactical_effect": "Chance de parade",
          "description_for_ai": "A long sword with a well-designed cross-guard, favored by trained soldiers. The blade is honed for both slashing and thrusting attacks.",
          "effect": null
        },
        {
          "id": "armor_warrior_01",
          "name": "Cotte de Mailles Lourde",
          "slot": "body",
          "bonuses": {
            "pm": -1,
            "hp": 2
          },
          "tactical_effect": "Réduction dégâts: 2",
          "description_for_ai": "Heavy chainmail armor that provides excellent protection but restricts movement slightly. The weight is balanced across the shoulders."
        },
        {
          "id": "consumable_warrior_01",
          "name": "Flasque de Vigueur",
          "slot": "consumable",
          "bonuses": {},
          "description_for_ai": "A leather flask containing a robust potion that mends wounds quickly.",
          "effect": "restore_hp",
          "effectValue": 10
        }
      ]
    },
    "class_rogue": {
      "name": "L'Invisible",
      "description": "Équipement pour combattant agile",
      "items": [
        {
          "id": "weapon_rogue_01",
          "name": "Dagues Jumelles",
          "slot": "weapon",
          "bonuses": {
            "finesse": 1
          },
          "tactical_effect": "+10% Taux de critique",
          "description_for_ai": "Twin daggers perfectly balanced for throwing or close combat. The blades are sharp and quick."
        },
        {
          "id": "armor_rogue_01",
          "name": "Plastron de Cuir Souple",
          "slot": "body",
          "bonuses": {
            "pm": 1
          },
          "tactical_effect": "Discrétion améliorée",
          "description_for_ai": "Soft leather armor that allows silent movement while providing basic protection. The color is dark and unremarkable."
        },
        {
          "id": "consumable_rogue_01",
          "name": "Fumigène",
          "slot": "consumable",
          "bonuses": {},
          "description_for_ai": "A small sphere that releases obscuring smoke when broken. Often used to escape dangerous situations.",
          "effect": "stealth_1_turn",
          "effectValue": 1
        }
      ]
    },
    "class_mage": {
      "name": "L'Éveillé",
      "description": "Équipement pour lanceur de sorts",
      "items": [
        {
          "id": "weapon_mage_01",
          "name": "Bâton en Bois de Fer",
          "slot": "weapon",
          "bonuses": {
            "mind": 1
          },
          "tactical_effect": "Portée des sorts +1",
          "description_for_ai": "An ancient staff carved from ironwood, thrumming with magical potential. The wood is warm to the touch and carved with mystical symbols."
        },
        {
          "id": "armor_mage_01",
          "name": "Robe d'Apprenti",
          "slot": "body",
          "bonuses": {
            "pa": 1
          },
          "tactical_effect": "Régénère 1 PA tous les 3 tours",
          "description_for_ai": "Simple robes embroidered with mystical symbols that channel ambient magic. The fabric seems to shimmer faintly in candlelight."
        },
        {
          "id": "consumable_mage_01",
          "name": "Élixir de Lucidité",
          "slot": "consumable",
          "bonuses": {},
          "description_for_ai": "A crystalline vial of shimmering liquid that sharpens mental focus and restores magical energy.",
          "effect": "restore_pa",
          "effectValue": 2
        }
      ]
    }
  }
}
```

---

# Backend Implementation

## 1. Inventory Service

```typescript
// apps/backend/src/domain/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel('ItemDefinition') private itemModel: Model<any>,
  ) {}

  /**
   * Get the starter pack items for a class
   * @param classId e.g., "class_warrior"
   * @returns Array of inventory items with all details
   */
  async getStarterPack(classId: string): Promise<InventoryItem[]> {
    const packIds = this.getPackItemIds(classId);
    
    const items = await this.itemModel
      .find({ id: { $in: packIds } })
      .lean();
    
    return items.map(item => ({
      itemId: item.id,
      slot: item.slot,
      name: item.name,
      bonuses: item.bonuses,
      tactical_effect: item.tactical_effect,
      effect: item.effect,
      effectValue: item.effectValue,
    }));
  }

  private getPackItemIds(classId: string): string[] {
    const packs = {
      'class_warrior': [
        'weapon_warrior_01',
        'armor_warrior_01',
        'consumable_warrior_01',
      ],
      'class_rogue': [
        'weapon_rogue_01',
        'armor_rogue_01',
        'consumable_rogue_01',
      ],
      'class_mage': [
        'weapon_mage_01',
        'armor_mage_01',
        'consumable_mage_01',
      ],
    };

    return packs[classId] || [];
  }
}
```

## 2. Character Service - Select Class

```typescript
// apps/backend/src/domain/character/character.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel('Character') private characterModel: Model<any>,
    private inventoryService: InventoryService,
    private statsService: StatsService,
  ) {}

  /**
   * Select class for character - assigns starter pack automatically
   * @param characterId Character to update
   * @param classId Class to assign (e.g., "class_warrior")
   * @returns Updated character with inventory and stats
   */
  async selectClass(characterId: string, classId: string): Promise<any> {
    const character = await this.characterModel.findById(characterId);
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Assign class
    character.classId = classId;

    // 🎁 AUTOMATIC STARTER PACK ASSIGNMENT
    const starterPack = await this.inventoryService.getStarterPack(classId);
    character.inventory = starterPack;

    // 📊 CALCULATE FINAL STATS (base + equipment bonuses)
    character.stats = this.statsService.calculateCharacterStats(character);

    await character.save();

    return character;
  }
}
```

## 3. Stats Service - Calculate Character Stats

```typescript
// apps/backend/src/domain/character/stats.service.ts
import { Injectable } from '@nestjs/common';

interface CharacterStats {
  hp: number;
  pa: number;
  pm: number;
  vigor: number;
  finesse: number;
  mind: number;
  survival: number;
}

@Injectable()
export class StatsService {
  /**
   * Calculate final stats by merging:
   * - Base stats by class
   * - Level-based scaling
   * - Equipment bonuses
   */
  calculateCharacterStats(character: any): CharacterStats {
    // Step 1: Get base stats by class
    const baseStats = this.getBaseStatsByClass(character.classId);

    // Step 2: Calculate level-based scaling
    const levelBonus = this.calculateLevelBonus(character.level);

    // Step 3: Calculate equipment bonuses from inventory
    const equipmentBonus = this.calculateEquipmentBonus(character.inventory);

    // Step 4: Merge all together
    return {
      hp: baseStats.hp + levelBonus.hp + equipmentBonus.hp,
      pa: baseStats.pa + levelBonus.pa + equipmentBonus.pa,
      pm: baseStats.pm + levelBonus.pm + equipmentBonus.pm,
      vigor: baseStats.vigor + levelBonus.vigor + equipmentBonus.vigor,
      finesse: baseStats.finesse + levelBonus.finesse + equipmentBonus.finesse,
      mind: baseStats.mind + levelBonus.mind + equipmentBonus.mind,
      survival: baseStats.survival + levelBonus.survival + equipmentBonus.survival,
    };
  }

  /**
   * Sum all bonuses from equipment
   * Handles negative bonuses (e.g., heavy armor reduces PM)
   */
  private calculateEquipmentBonus(inventory: any[]): Partial<CharacterStats> {
    const bonus: any = {
      hp: 0,
      pa: 0,
      pm: 0,
      vigor: 0,
      finesse: 0,
      mind: 0,
      survival: 0,
    };

    if (!inventory || !Array.isArray(inventory)) {
      return bonus;
    }

    for (const item of inventory) {
      if (item.bonuses) {
        Object.entries(item.bonuses).forEach(([key, value]: [string, any]) => {
          if (key in bonus) {
            bonus[key] += value;
          }
        });
      }
    }

    return bonus;
  }

  /**
   * Level-based scaling: every 5 levels = +1 to all attributes
   * Scaling formula: 1 + floor(level / 5)
   */
  private calculateLevelBonus(level: number): Partial<CharacterStats> {
    const bonus = Math.floor(level / 5);
    return {
      hp: 0,  // HP scales with level differently (see class base)
      pa: 0,  // PA/PM don't scale with level
      pm: 0,
      vigor: bonus,
      finesse: bonus,
      mind: bonus,
      survival: bonus,
    };
  }

  /**
   * Base stats by class (Level 1)
   * These are starting values before equipment or leveling
   */
  private getBaseStatsByClass(classId: string): CharacterStats {
    const bases: Record<string, CharacterStats> = {
      class_warrior: {
        hp: 12,
        pa: 6,
        pm: 6,
        vigor: 10,
        finesse: 9,
        mind: 8,
        survival: 9,
      },
      class_rogue: {
        hp: 10,
        pa: 5,
        pm: 6,
        vigor: 9,
        finesse: 11,
        mind: 8,
        survival: 10,
      },
      class_mage: {
        hp: 8,
        pa: 7,
        pm: 5,
        vigor: 8,
        finesse: 9,
        mind: 12,
        survival: 8,
      },
    };

    return bases[classId] || bases.class_warrior;
  }
}
```

## 4. Character Controller

```typescript
// apps/backend/src/controllers/character/character.controller.ts
import { Controller, Post, Param, Body } from '@nestjs/common';
import { CharacterService } from '@domain/character/character.service';

@Controller('api/characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  /**
   * POST /api/characters/:id/select-class
   * User selects a class - backend assigns starter pack and calculates stats
   */
  @Post(':id/select-class')
  async selectClass(
    @Param('id') characterId: string,
    @Body() payload: { classId: string },
  ) {
    const character = await this.characterService.selectClass(
      characterId,
      payload.classId,
    );

    return {
      success: true,
      character,
    };
  }
}
```

---

# Frontend Implementation

## StepClassSelection.vue (Updated)

```vue
<template>
  <div class="step-class-selection">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold">Choisissez votre classe</h2>
      <p class="text-gray-600 mt-2">Votre équipement de départ sera assigné automatiquement</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div
        v-for="cls in classes"
        :key="cls.id"
        class="class-card cursor-pointer transition-all"
        :class="{
          'ring-2 ring-blue-500 shadow-lg': isSelected(cls.id),
          'hover:shadow-md': !isSelected(cls.id),
        }"
        @click="selectClass(cls.id)"
      >
        <!-- Class image -->
        <div class="relative h-48 overflow-hidden rounded-t bg-gray-200">
          <img :src="cls.image" :alt="cls.name" class="w-full h-full object-cover" />
        </div>

        <!-- Class info -->
        <div class="p-4 bg-white rounded-b border border-gray-200">
          <h3 class="font-bold text-lg">{{ cls.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ cls.description }}</p>

          <!-- Base stats preview -->
          <div class="mt-4 space-y-1 text-xs bg-gray-50 p-2 rounded">
            <div class="flex justify-between">
              <span>❤️ HP:</span>
              <span class="font-semibold">{{ getBaseStats(cls.id).hp }}</span>
            </div>
            <div class="flex justify-between">
              <span>⚡ PA:</span>
              <span class="font-semibold">{{ getBaseStats(cls.id).pa }}</span>
            </div>
            <div class="flex justify-between">
              <span>👟 PM:</span>
              <span class="font-semibold">{{ getBaseStats(cls.id).pm }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ AUTO-ASSIGNMENT FEEDBACK -->
    <div v-if="selectedClass" class="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
      <div class="flex items-start">
        <span class="text-2xl mr-3">🎁</span>
        <div>
          <p class="font-semibold text-green-900">Starter Pack assigné!</p>
          <ul class="text-sm mt-2 space-y-1 text-green-800">
            <li v-for="item in selectedPackItems" :key="item.itemId">
              ✓ {{ item.name }}
            </li>
          </ul>
          <p class="text-xs text-green-700 mt-3">
            Votre équipement de base est prêt. Cliquez sur "Suivant" pour choisir votre portrait →
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="mt-8 flex justify-between">
      <button
        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        @click="$emit('prev')"
      >
        Précédent
      </button>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        :disabled="!selectedClass"
        @click="$emit('next')"
      >
        Suivant
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCharacterCreation } from '@/composables/useCharacterCreation';
import { characterService } from '@/services/character.service';
import { CLASS_METADATA } from '@/data/classes';

const { currentCharacter } = useCharacterCreation();
const selectedClass = ref<string | null>(null);
const isLoading = ref(false);

const classes = computed(() => [
  {
    id: 'class_warrior',
    name: 'Guerrier',
    description: 'L\'Indestructible - Fort et robuste',
    image: '/images/classes/warrior.jpg',
  },
  {
    id: 'class_rogue',
    name: 'Rogue',
    description: 'L\'Invisible - Rapide et discret',
    image: '/images/classes/rogue.jpg',
  },
  {
    id: 'class_mage',
    name: 'Mage',
    description: 'L\'Éveillé - Puissant et mystique',
    image: '/images/classes/mage.jpg',
  },
]);

const selectedPackItems = computed(() => {
  if (!selectedClass.value) return [];
  return getStarterPack(selectedClass.value);
});

const selectClass = async (classId: string) => {
  selectedClass.value = classId;
  isLoading.value = true;

  try {
    // 🎯 Backend assigns starter pack automatically
    const response = await characterService.selectClass({
      characterId: currentCharacter.value!.id,
      classId,
    });

    // Character now has: classId, inventory, calculated stats
    Object.assign(currentCharacter.value!, response.character);
  } finally {
    isLoading.value = false;
  }
};

const getBaseStats = (classId: string) => {
  return CLASS_METADATA[classId].baseStats;
};

const getStarterPack = (classId: string) => {
  // This is mock data - real data comes from backend
  // Shown here for visual feedback only
  const packs = {
    class_warrior: [
      { itemId: 'weapon_warrior_01', name: '🗡️ Épée Longue de Garde' },
      { itemId: 'armor_warrior_01', name: '🛡️ Cotte de Mailles Lourde' },
      { itemId: 'consumable_warrior_01', name: '🧪 Flasque de Vigueur' },
    ],
    class_rogue: [
      { itemId: 'weapon_rogue_01', name: '🔪 Dagues Jumelles' },
      { itemId: 'armor_rogue_01', name: '👕 Plastron de Cuir Souple' },
      { itemId: 'consumable_rogue_01', name: '💨 Fumigène' },
    ],
    class_mage: [
      { itemId: 'weapon_mage_01', name: '🔱 Bâton en Bois de Fer' },
      { itemId: 'armor_mage_01', name: '🧥 Robe d\'Apprenti' },
      { itemId: 'consumable_mage_01', name: '✨ Élixir de Lucidité' },
    ],
  };

  return packs[classId] || [];
};
</script>

<style scoped>
.class-card {
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.class-card:hover {
  border-color: #e0e0e0;
}

.class-card.ring-2 {
  border-color: transparent;
}
</style>
```

---

# Updated CharacterCreatorWizard.vue

```typescript
// packages/frontend/src/components/character-creation/CharacterCreatorWizard.vue

import StepCharacterInfo from './steps/StepCharacterInfo.vue';
import StepClassSelection from './steps/StepClassSelection.vue';
import StepAvatarSelection from './steps/StepAvatarSelection.vue';

const steps = [
  {
    id: 'info',
    component: StepCharacterInfo,
    title: 'Qui êtes-vous?',
    description: 'Entrez le nom de votre personnage',
  },
  {
    id: 'class',
    component: StepClassSelection,
    title: 'Choisissez votre classe',
    description: 'Votre équipement sera assigné automatiquement',
  },
  {
    id: 'avatar',
    component: StepAvatarSelection,
    title: 'Sélectionnez votre portrait',
    description: 'Choisissez l\'apparence de votre héros',
  },
  // ❌ StepInventory removed - no longer needed
];

// Calculation: 3 steps × ~5 minutes each = 15 minutes total creation time
// Old system: 4 steps × ~4 minutes = 16 minutes (but with confusion on inventory step)
// Result: Clearer, faster, better for new players
```

---

# Comparison: Old vs New

| Aspect | Old System | New System |
|--------|-----------|-----------|
| **Wizard Steps** | 4 (Info → Class → **Inventory** → Avatar) | 3 (Info → Class → Avatar) |
| **Inventory Selection** | Manual (user picks items) | Automatic (backend assigns) |
| **User Confusion** | ⚠️ Players don't know what items do | ✅ Clear, no choices needed |
| **Balance** | ⚠️ Players can make bad choices | ✅ Guaranteed balanced starter gear |
| **Stats Display** | Stats shown, no equipment impact | ✅ Stats calculated with equipment |
| **Time to Create** | ~15 min (with confusion) | ~12 min (clear path) |
| **New Player Experience** | Overwhelming | Streamlined |

---

# Files to Delete

```
packages/frontend/src/components/character-creation/steps/StepInventory.vue ❌
packages/frontend/src/components/character-creation/steps/__tests__/StepInventory.spec.ts ❌
packages/frontend/src/composables/useInventoryAutoAssign.ts ❌ (old implementation)
```

# Files to Create

```
apps/backend/src/domain/inventory/inventory.service.ts ✨
apps/backend/src/domain/item/ItemDefinition.ts ✨
apps/backend/src/infra/mongo/item/item.schema.ts ✨
apps/backend/src/seed/items_seed.json ✨
packages/frontend/src/data/classes.ts ✨ (updated with starter pack info)
```

---

# Testing

## Backend Tests

```typescript
// apps/backend/test/unit/character/character.service.spec.ts
describe('CharacterService.selectClass', () => {
  it('should assign starter pack for Warrior', async () => {
    const character = await characterService.selectClass('char_123', 'class_warrior');
    expect(character.inventory).toHaveLength(3);
    expect(character.inventory[0].itemId).toBe('weapon_warrior_01');
  });

  it('should calculate stats including equipment bonuses', async () => {
    const character = await characterService.selectClass('char_123', 'class_warrior');
    // Base Warrior: HP 12, but Cotte de Mailles adds +2 effective HP
    expect(character.stats.hp).toBe(14);
  });

  it('should apply negative bonuses (heavy armor reduces PM)', async () => {
    const character = await characterService.selectClass('char_123', 'class_warrior');
    // Base Warrior: PM 6, but Cotte de Mailles reduces by -1
    expect(character.stats.pm).toBe(5);
  });
});
```

## Frontend Tests

```typescript
// packages/frontend/src/components/character-creation/steps/__tests__/StepClassSelection.spec.ts
describe('StepClassSelection', () => {
  it('should display 3 class cards', () => {
    const { getAllByRole } = render(StepClassSelection);
    const cards = getAllByRole('button');
    expect(cards).toHaveLength(3);
  });

  it('should call selectClass API when class card clicked', async () => {
    const { getByText } = render(StepClassSelection);
    const warriorCard = getByText('Guerrier');
    await userEvent.click(warriorCard);
    expect(characterService.selectClass).toHaveBeenCalled();
  });

  it('should show starter pack items after selection', async () => {
    const { getByText } = render(StepClassSelection);
    const warriorCard = getByText('Guerrier');
    await userEvent.click(warriorCard);
    expect(getByText('Épée Longue de Garde')).toBeInTheDocument();
  });
});
```

---

# Integration with Combat System

After character creation, the inventory impacts combat:

```typescript
// During combat:
// 1. Base PA/PM from stats: 6 PA, 5 PM
// 2. Tactical effects apply:
//    - Épée Longue: "Chance de parade" → +10% block chance
//    - Cotte de Mailles: "Réduction dégâts: 2" → -2 incoming damage
//    - Robe d'Apprenti: "Régénère 1 PA tous les 3 tours" → passive regeneration

// Equipment-based Aptitudes available post-creation:
// - Equipped items unlock class-specific Aptitudes
// - Example: Guerrier with Épée can unlock "Coup de Lame" Aptitude
```

---

# Summary

✅ **Inventory is now 100% automatic**  
✅ **Character creation is 3 steps, not 4**  
✅ **Backend assigns fair starter packs by class**  
✅ **Stats calculated with equipment bonuses**  
✅ **Better UX for new players**  
✅ **Guaranteed balance (no bad gear choices)**  

**Ready to implement!**
