<template>
  <div class="relative w-full">
    <!-- Portrait -->
    <div
      class="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-square mx-auto"
    >
      <CharacterIllustration
        :clazz="currentCharacter?.className || ''"
        :race-id="currentCharacter?.race?.id"
        :gender="currentCharacter?.gender"
        :src="currentCharacter?.portrait"
      />

      <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2">
        <div class="text-white font-bold text-sm truncate">
          {{ currentCharacter?.name }}
        </div>
        <div class="text-amber-300 text-xs">
          {{ currentCharacter?.className }} Lvl {{ currentCharacter?.level || 1 }}
        </div>
      </div>
      <div class="absolute top-0 right-0 p-2">
        <div class="text-red-400 font-bold text-sm mb-2">❤️ {{ hp }}</div>
        <div class="text-purple-400 font-bold text-sm">✨ {{ inspirationPoints }}</div>
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"
      >
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
import { useCharacterId } from '@/composables/useCharacterId';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCombat } from '@rpg-gen/api-client';
import { UiXpBar } from '@rpg-gen/ui';
import { computed } from 'vue';
import { getCurrentLevel, getXpProgress } from '../../utils/dndLevels';
import CharacterIllustration from './CharacterIllustration.vue';

const currentCharacterId = useCharacterId();
const currentCharacter = useCurrentCharacter();
const {status} = useCombat(currentCharacterId);

const combatStatus = computed(() => status.data.value);

const hp = computed(() => {
  if (status.data.value?.inCombat && status) {
    return `${combatStatus.value?.player.hp ?? 0}/${combatStatus.value?.player.hpMax}`;
  }
  if (!currentCharacter) throw new Error('No current character');
  return `${currentCharacter?.value?.hp || 0}/${currentCharacter?.value?.hpMax || 12}`;
});

const currentLevel = computed(() => {
  const xp = currentCharacter?.value?.totalXp || 0;
  const level = getCurrentLevel(xp);
  return `Level ${level.level}`;
});

const xpPercent = computed(() => {
  const xp = currentCharacter?.value?.totalXp || 0;
  const progress = getXpProgress(xp);
  return progress.percentage;
});

const inspirationPoints = computed(() => currentCharacter?.value?.inspirationPoints || 0);
</script>

<style scoped>
.aspect-square {
  aspect-ratio: 1 / 1;
}
</style>
