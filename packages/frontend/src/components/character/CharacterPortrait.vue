<template>
  <div class="relative w-full">
    <!-- Portrait -->
    <div
      class="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-square mx-auto"
    >
      <CharacterIllustration
        :clazz="currentCharacter?.classes?.[0]?.name || ''"
        :race-id="currentCharacter?.race?.id"
        :gender="currentCharacter?.gender"
        :src="currentCharacter?.portrait"
      />

      <div class="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-2">
        <div class="text-white font-bold text-sm truncate">
          {{ currentCharacter?.name }}
        </div>
        <div class="text-amber-300 text-xs">
          {{ currentCharacter?.classes?.[0]?.name }} Lvl {{ currentCharacter?.classes?.[0]?.level || 1 }}
        </div>
      </div>
      <div class="absolute top-0 right-0 p-2">
        <div class="text-red-400 font-bold text-sm mb-2">
          ❤️ {{ hp }}
        </div>
        <div class="text-sky-300 font-bold text-sm mb-2">
          🛡️ AC: {{ ac }}
        </div>
        <div class="text-purple-400 font-bold text-sm">
          ✨ {{ inspirationPoints }}
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
        <!-- XP Bar -->
        <UiXpBar
          :percentage="xpPercent"
          :label="currentLevel"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { computed } from 'vue';
import { getCurrentLevel, getXpProgress } from '../../utils/dndLevels';
import { DnDRulesService } from '@/services/dndRulesService';
import UiXpBar from '../ui/UiXpBar.vue';
import CharacterIllustration from './CharacterIllustration.vue';
import { storeToRefs } from 'pinia';

interface InventoryItem {
  meta?: { class?: string; type?: string; ac?: string | number };
}

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const hp = computed(() => {
  if (!currentCharacter.value) return '0/0';
  return `${currentCharacter.value.hp || 0}/${currentCharacter.value.hpMax || 12}`;
});

const currentLevel = computed(() => {
  const xp = currentCharacter.value?.totalXp || 0;
  const level = getCurrentLevel(xp);
  return `Level ${level.level}`;
});

const xpPercent = computed(() => {
  const xp = currentCharacter.value?.totalXp || 0;
  const progress = getXpProgress(xp);
  return progress.percentage;
});

const parseShieldBonus = (item: InventoryItem): number => {
  if (!item.meta?.ac) return 0;
  const m = String(item.meta.ac).match(/([+-]?\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

const isShield = (item: InventoryItem): boolean => item.meta?.class === 'Shield'
  || (item.meta?.type === 'armor' && (item.meta?.class || '').toLowerCase() === 'shield');

const calculateDexBonus = (acRaw: string, dexMod: number): number => {
  const usesDex = /dex/i.test(acRaw);
  if (!usesDex) return 0;
  const capMatch = acRaw.match(/max\s*[:(\s]*?(\d+)/i);
  if (capMatch) {
    const cap = parseInt(capMatch[1], 10);
    return Math.min(dexMod, isNaN(cap) ? dexMod : cap);
  }
  return dexMod;
};

const inspirationPoints = computed(() => currentCharacter.value?.inspirationPoints || 0);

const getCharValue = () => currentCharacter.value as {
  ac?: number;
  armorClass?: number;
  scores?: Record<string, number>;
  inventory?: InventoryItem[];
};

const computeArmorAc = (armor: InventoryItem, dexMod: number, shieldBonus: number): number | null => {
  if (!armor.meta?.ac) return null;
  const acRaw = String(armor.meta.ac);
  const baseMatch = acRaw.match(/(\d+)/);
  const base = baseMatch ? parseInt(baseMatch[1], 10) : null;
  if (base !== null) return base + calculateDexBonus(acRaw, dexMod) + shieldBonus;
  return null;
};

const ac = computed(() => {
  if (!currentCharacter.value) return '-';

  const charValue = getCharValue();
  const explicitAc = charValue.ac ?? charValue.armorClass;
  if (explicitAc !== undefined && explicitAc !== null) return explicitAc;

  const inv = currentCharacter.value.inventory ?? [];
  const shield = inv.find(isShield);
  const shieldBonus = shield ? parseShieldBonus(shield) : 0;
  const armor = inv.find((i: InventoryItem) => i.meta?.type === 'armor' && !isShield(i));

  const dexScore = charValue.scores?.Dex ?? charValue.scores?.dex ?? 10;
  const dexMod = DnDRulesService.getAbilityModifier(Number(dexScore || 10));

  if (armor) {
    const armorAc = computeArmorAc(armor, dexMod, shieldBonus);
    if (armorAc !== null) return armorAc;
  }

  return 10 + dexMod + shieldBonus;
});
</script>

<style scoped>
.aspect-square {
    aspect-ratio: 1 / 1;
}
</style>
