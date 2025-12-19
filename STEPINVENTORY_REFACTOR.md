# Inventory System - OBSOLETE DOCUMENT

⚠️ **This document has been replaced by INVENTORY_SYSTEM.md**

## Quick Summary

✅ **Inventory selection has been COMPLETELY REMOVED from character creation**
✅ **The wizard now has only 3 steps (not 4)**
✅ **Backend auto-assigns starter packs by class**

## What Changed

| Before | After |
|--------|-------|
| 4-step wizard (Info → Class → **Inventory** → Avatar) | 3-step wizard (Info → Class → Avatar) |
| User manually selects items | Backend assigns items automatically |
| Confusing for new players | Clear and fast |

## New Architecture

See **[INVENTORY_SYSTEM.md](INVENTORY_SYSTEM.md)** for complete documentation including:
- ItemDefinition schema
- Starter packs for all 3 classes
- Auto-assignment implementation
- Stats calculation with equipment bonuses
- Frontend & backend code examples

---

## 🎯 Comportement Cible

### État 1: Aucune classe sélectionnée
```
┌─────────────────────────────┐
│ Inventaire                  │
│                             │
│ ⚠️ Sélectionnez d'abord     │
│    votre classe pour voir   │
│    l'inventaire de départ.  │
│                             │
│ [Retour à l'étape précédente]│
└─────────────────────────────┘
```

### État 2: Classe sélectionnée (exemple: Guerrier)
```
┌─────────────────────────────────────────────────┐
│ Inventaire de Guerrier                          │
│ Équipement attribué automatiquement             │
│                                                 │
│ ☑️ PACK DE DÉPART (non-modifiable)             │
│ ├─ ☑️ Chaîne de mail (Armure)                  │
│ ├─ ☑️ Pain et eau (Rations) x5                 │
│ └─ ☑️ Corde (Cordage) x50                      │
│                                                 │
│ 🗡️ ARME DE DÉPART (une seule, auto)           │
│ ├─ ☑️ Épée longue (Arme)                       │
│ └─ ○ (ou autre arme selon classe)              │
│                                                 │
│ [Continuer vers personnalisation]              │
└─────────────────────────────────────────────────┘
```

---

## 📝 Logique TypeScript

### Data mapping par classe

```typescript
// Définir la correspondance classe → inventaire
const STARTING_INVENTORY = {
  guerrier: {
    basePack: [
      { name: 'Chaîne de mail', description: 'Armure de qualité moyenne', type: 'armor', qty: 1 },
      { name: 'Pain et eau', description: 'Rations pour la route', type: 'consumable', qty: 5 },
      { name: 'Corde', description: 'Cordage utile', type: 'tool', qty: 50 },
      { name: 'Torche', description: 'Illumine l\'obscurité', type: 'tool', qty: 2 },
    ],
    weapon: { name: 'Épée longue', description: 'Arme de corps à corps puissante', type: 'weapon', qty: 1 },
  },
  rogue: {
    basePack: [
      { name: 'Armure de cuir', description: 'Légère et silencieuse', type: 'armor', qty: 1 },
      { name: 'Pain et eau', description: 'Rations pour la route', type: 'consumable', qty: 5 },
      { name: 'Outils de crochetage', description: 'Pour les serrures', type: 'tool', qty: 1 },
      { name: 'Corde de soie', description: 'Cordage fin', type: 'tool', qty: 50 },
    ],
    weapon: { name: 'Dague', description: 'Arme discrète et tranchante', type: 'weapon', qty: 2 },
  },
  mage: {
    basePack: [
      { name: 'Robe de mage', description: 'Offre peu de protection', type: 'armor', qty: 1 },
      { name: 'Pain et eau', description: 'Rations pour la route', type: 'consumable', qty: 5 },
      { name: 'Grimoire vierge', description: 'Pour noter les formules', type: 'tool', qty: 1 },
      { name: 'Composantes', description: 'Encens, herbes, cristaux', type: 'tool', qty: 20 },
    ],
    weapon: { name: 'Bâton', description: 'Focalisateur magique', type: 'weapon', qty: 1 },
  },
};

// Récupérer l'inventaire pour la classe actuelle
const getStartingInventory = (className: string) => {
  const classKey = className.toLowerCase();
  return STARTING_INVENTORY[classKey] || null;
};
```

### Composable - useInventoryAutoAssign

```typescript
// src/composables/useInventoryAutoAssign.ts
import { computed } from 'vue';
import { STARTING_INVENTORY } from '@/data/inventory';
import { useCurrentCharacter } from './useCurrentCharacter';

export function useInventoryAutoAssign() {
  const currentCharacter = useCurrentCharacter();

  const selectedClassName = computed(() => {
    return currentCharacter.value?.classes?.[0]?.name ?? null;
  });

  const basePack = computed(() => {
    if (!selectedClassName.value) return [];
    const inv = STARTING_INVENTORY[selectedClassName.value.toLowerCase()];
    return inv?.basePack ?? [];
  });

  const startingWeapon = computed(() => {
    if (!selectedClassName.value) return null;
    const inv = STARTING_INVENTORY[selectedClassName.value.toLowerCase()];
    return inv?.weapon ?? null;
  });

  const hasClassSelected = computed(() => !!selectedClassName.value);

  return {
    selectedClassName,
    basePack,
    startingWeapon,
    hasClassSelected,
  };
}
```

---

## 🎨 Template - StepInventory.vue (Nouveau)

```vue
<template>
  <div class="p-2 lg:p-4 max-h-[calc(100vh-220px)] lg:max-h-145 overflow-y-auto space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl lg:text-2xl font-bold mb-2">Équipement</h2>
      <p class="text-slate-400 text-sm">Votre équipement est attribué automatiquement selon votre classe.</p>
    </div>

    <!-- State: No class selected -->
    <div v-if="!hasClassSelected" class="py-12 text-center">
      <div class="text-6xl mb-4">📦</div>
      <p class="text-slate-300 mb-2">Veuillez d'abord sélectionner votre classe.</p>
      <p class="text-sm text-slate-400">L'inventaire s'affichera une fois votre choix confirmé.</p>
    </div>

    <!-- State: Class selected - show inventory -->
    <div v-else class="space-y-6">
      <!-- Class info ribbon -->
      <div class="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 rounded-lg">
        <p class="font-semibold">
          Équipement de <span class="text-indigo-300">{{ selectedClassName }}</span>
        </p>
        <p class="text-sm text-slate-300 mt-1">Inventaire déterminé automatiquement</p>
      </div>

      <!-- Base Pack Section -->
      <section class="space-y-3">
        <h3 class="font-semibold text-lg flex items-center gap-2">
          <span>📦</span>
          Pack de départ
        </h3>
        <p class="text-xs text-slate-400">Vous commencez automatiquement avec cet équipement.</p>

        <!-- Items -->
        <div class="space-y-2">
          <div
            v-for="item in basePack"
            :key="`base-${item.name}`"
            class="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded"
          >
            <!-- Checkbox (disabled, always checked) -->
            <div class="flex-shrink-0">
              <input
                type="checkbox"
                checked
                disabled
                class="w-4 h-4 accent-indigo-500 cursor-not-allowed"
              />
            </div>

            <!-- Item info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm">{{ item.name }}</div>
              <div class="text-xs text-slate-400">{{ item.description }}</div>
            </div>

            <!-- Quantity -->
            <div class="flex-shrink-0 text-right">
              <div class="font-semibold text-sm">x{{ item.qty }}</div>
              <div class="text-xs text-slate-500">{{ item.type }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Weapon Section -->
      <section v-if="startingWeapon" class="space-y-3">
        <h3 class="font-semibold text-lg flex items-center gap-2">
          <span>⚔️</span>
          Arme de départ
        </h3>
        <p class="text-xs text-slate-400">Sélection automatique adaptée à votre classe.</p>

        <div class="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded">
          <!-- Checkbox (disabled, always checked) -->
          <div class="flex-shrink-0">
            <input
              type="checkbox"
              checked
              disabled
              class="w-4 h-4 accent-indigo-500 cursor-not-allowed"
            />
          </div>

          <!-- Weapon info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ startingWeapon.name }}</div>
            <div class="text-xs text-slate-400">{{ startingWeapon.description }}</div>
          </div>

          <!-- Quantity -->
          <div class="flex-shrink-0 text-right">
            <div class="font-semibold text-sm">x{{ startingWeapon.qty }}</div>
            <div class="text-xs text-slate-500">{{ startingWeapon.type }}</div>
          </div>
        </div>
      </section>

      <!-- Info callout -->
      <div class="bg-slate-900 border border-slate-700 p-3 rounded text-sm text-slate-300">
        <p class="font-semibold mb-1">ℹ️ Note</p>
        <p>Vous pourrez acquérir d'autres équipements au cours de vos aventures. Cet inventaire représente votre équipement initial.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInventoryAutoAssign } from '@/composables/useInventoryAutoAssign';

const { selectedClassName, basePack, startingWeapon, hasClassSelected } = useInventoryAutoAssign();
</script>
```

---

## 📋 Définir les Données d'Inventaire - src/data/inventory.ts

```typescript
// src/data/inventory.ts
export interface InventoryItem {
  name: string;
  description: string;
  type: 'armor' | 'weapon' | 'consumable' | 'tool';
  qty: number;
}

export interface ClassInventory {
  basePack: InventoryItem[];
  weapon: InventoryItem;
}

export const STARTING_INVENTORY: Record<string, ClassInventory> = {
  guerrier: {
    basePack: [
      {
        name: 'Chaîne de mail',
        description: 'Armure de qualité moyenne, offre une bonne protection',
        type: 'armor',
        qty: 1,
      },
      {
        name: 'Pain et eau',
        description: 'Rations pour 5 jours de voyage',
        type: 'consumable',
        qty: 5,
      },
      {
        name: 'Corde',
        description: 'Cordage utile pour l\'escalade et la sécurisation',
        type: 'tool',
        qty: 50,
      },
      {
        name: 'Torche',
        description: 'Illumine l\'obscurité pendant 6 heures',
        type: 'tool',
        qty: 2,
      },
      {
        name: 'Sacoche',
        description: 'Sac de voyage pour transporter vos affaires',
        type: 'tool',
        qty: 1,
      },
    ],
    weapon: {
      name: 'Épée longue',
      description: 'Arme de corps à corps puissante et fiable',
      type: 'weapon',
      qty: 1,
    },
  },

  rogue: {
    basePack: [
      {
        name: 'Armure de cuir',
        description: 'Légère et silencieuse, favorise la discrétion',
        type: 'armor',
        qty: 1,
      },
      {
        name: 'Pain et eau',
        description: 'Rations pour 5 jours de voyage',
        type: 'consumable',
        qty: 5,
      },
      {
        name: 'Outils de crochetage',
        description: 'Nécessaire complet pour crocheter les serrures',
        type: 'tool',
        qty: 1,
      },
      {
        name: 'Corde de soie',
        description: 'Cordage fin et discret, 50m',
        type: 'tool',
        qty: 1,
      },
      {
        name: 'Sacoche',
        description: 'Sac de voyage pour transporter vos affaires',
        type: 'tool',
        qty: 1,
      },
    ],
    weapon: {
      name: 'Dague',
      description: 'Arme discrète, légère et tranchante',
      type: 'weapon',
      qty: 2,
    },
  },

  mage: {
    basePack: [
      {
        name: 'Robe de mage',
        description: 'Offre peu de protection mais aide à la concentration magique',
        type: 'armor',
        qty: 1,
      },
      {
        name: 'Pain et eau',
        description: 'Rations pour 5 jours de voyage',
        type: 'consumable',
        qty: 5,
      },
      {
        name: 'Grimoire vierge',
        description: 'Carnet pour noter les formules magiques',
        type: 'tool',
        qty: 1,
      },
      {
        name: 'Composantes magiques',
        description: 'Encens, herbes, cristaux et poudres magiques',
        type: 'tool',
        qty: 20,
      },
      {
        name: 'Sacoche',
        description: 'Sac de voyage pour transporter vos affaires',
        type: 'tool',
        qty: 1,
      },
    ],
    weapon: {
      name: 'Bâton',
      description: 'Focalisateur magique classique et fiable',
      type: 'weapon',
      qty: 1,
    },
  },
};
```

---

## 🧪 Tests - StepInventory.test.ts (Adapté)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StepInventory from './StepInventory.vue';
import { useInventoryAutoAssign } from '@/composables/useInventoryAutoAssign';

vi.mock('@/composables/useInventoryAutoAssign');

describe('StepInventory.vue (Refactored)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche message quand aucune classe sélectionnée', () => {
    vi.mocked(useInventoryAutoAssign).mockReturnValue({
      selectedClassName: { value: null },
      basePack: { value: [] },
      startingWeapon: { value: null },
      hasClassSelected: { value: false },
    });

    const wrapper = mount(StepInventory);
    expect(wrapper.text()).toContain('Veuillez d\'abord sélectionner votre classe');
  });

  it('affiche inventaire quand classe sélectionnée', () => {
    const mockBasePack = [
      { name: 'Chaîne de mail', description: 'Armure', type: 'armor', qty: 1 },
    ];
    const mockWeapon = { name: 'Épée longue', description: 'Arme', type: 'weapon', qty: 1 };

    vi.mocked(useInventoryAutoAssign).mockReturnValue({
      selectedClassName: { value: 'Guerrier' },
      basePack: { value: mockBasePack },
      startingWeapon: { value: mockWeapon },
      hasClassSelected: { value: true },
    });

    const wrapper = mount(StepInventory);
    expect(wrapper.text()).toContain('Chaîne de mail');
    expect(wrapper.text()).toContain('Épée longue');
  });

  it('affiche tous les items du pack', () => {
    const mockBasePack = [
      { name: 'Item 1', description: 'Desc 1', type: 'armor', qty: 1 },
      { name: 'Item 2', description: 'Desc 2', type: 'tool', qty: 5 },
    ];

    vi.mocked(useInventoryAutoAssign).mockReturnValue({
      selectedClassName: { value: 'Guerrier' },
      basePack: { value: mockBasePack },
      startingWeapon: { value: null },
      hasClassSelected: { value: true },
    });

    const wrapper = mount(StepInventory);
    expect(wrapper.text()).toContain('Item 1');
    expect(wrapper.text()).toContain('Item 2');
  });

  it('checkboxes items sont disabled', () => {
    const mockBasePack = [
      { name: 'Armure', description: 'Desc', type: 'armor', qty: 1 },
    ];

    vi.mocked(useInventoryAutoAssign).mockReturnValue({
      selectedClassName: { value: 'Guerrier' },
      basePack: { value: mockBasePack },
      startingWeapon: { value: null },
      hasClassSelected: { value: true },
    });

    const wrapper = mount(StepInventory);
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      expect(checkbox.attributes('disabled')).toBeDefined();
    });
  });
});
```

---

## 🔗 Intégration dans CharacterCreatorWizard

```typescript
// Dans CharacterCreatorWizard.vue
const steps = [
  'Informations',
  'Classe',      // Nouveau: StepClassSelection
  'Inventaire',  // Adapté: StepInventory (auto)
  'Avatar',      // Ancien: StepAvatar
];

// Rendu
<StepClassSelection v-if="currentStep === 1" />
<StepInventory v-if="currentStep === 2" />
<StepAvatar v-if="currentStep === 3" />
```

---

## ✅ Checklist pour StepInventory

- [ ] Créer `src/data/inventory.ts` avec données
- [ ] Créer `useInventoryAutoAssign.ts` composable
- [ ] Adapter `StepInventory.vue` avec nouveau template
- [ ] Ajouter tests (mock useInventoryAutoAssign)
- [ ] Vérifier intégration dans CharacterCreatorWizard
- [ ] Supprimer sections "optional weapons", "adventuring gear"
- [ ] Tester avec les 3 classes
- [ ] Vérifier affichage sur mobile (grid responsive)
