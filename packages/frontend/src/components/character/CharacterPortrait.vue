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

const inspirationPoints = computed(() => currentCharacter.value?.inspirationPoints || 0);
const ac = computed(() => {
  if (!currentCharacter.value) return '-';

  // If backend already provides AC, use it
  const explicitAc = (currentCharacter.value as any).ac ?? (currentCharacter.value as any).armorClass;
  if (explicitAc !== undefined && explicitAc !== null) return explicitAc;

  // Compute from inventory and DEX modifier
  const inv = currentCharacter.value.inventory ?? [];
  // Shield bonus: look for shield item with meta.ac like '+2'
  const shield = inv.find((i: any) => i.meta?.class === 'Shield' || (i.meta?.type === 'armor' && (i.meta?.class || '').toLowerCase() === 'shield')) as any;
  let shieldBonus = 0;
  if (shield && shield.meta?.ac) {
    const s = String(shield.meta.ac);
    const m = s.match(/([+-]?\d+)/);
    if (m) shieldBonus = parseInt(m[1], 10);
  }

  // Armor item (non-shield)
  const armor = inv.find((i: any) => i.meta?.type === 'armor' && !(i.meta?.class === 'Shield')) as any;

  const dexScore = (currentCharacter.value as any).scores?.Dex ?? (currentCharacter.value as any).scores?.dex ?? 10;
  const dexMod = DnDRulesService.getAbilityModifier(Number(dexScore || 10));

  if (armor && armor.meta?.ac) {
    // Examples: '11 + Dex', '12 + Dex', 14, '+2'
    const acRaw = String(armor.meta.ac);
    const baseMatch = acRaw.match(/(\d+)/);
    const base = baseMatch ? parseInt(baseMatch[1], 10) : null;
    const usesDex = /dex/i.test(acRaw) || /Dex/.test(acRaw);
    if (base !== null) {
      // Respect optional Dex cap in armor description (e.g. 'max 2')
      let dexToAdd = 0;
      if (usesDex) {
        const capMatch = acRaw.match(/max\s*[:\(\s]*?(\d+)/i);
        if (capMatch) {
          const cap = parseInt(capMatch[1], 10);
          dexToAdd = Math.min(dexMod, isNaN(cap) ? dexMod : cap);
        } else {
          dexToAdd = dexMod;
        }
      }

      return base + dexToAdd + shieldBonus;
    }
  }

  // Default: 10 + DEX modifier + shield
  return 10 + dexMod + shieldBonus;
});
</script>

<style scoped>
.aspect-square {
    aspect-ratio: 1 / 1;
}
</style>
