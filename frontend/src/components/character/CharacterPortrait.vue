<template>
  <div class="relative w-full">
    <!-- Portrait -->
    <div
      class="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-square h-64 mx-auto"
    >
      <CharacterIllustration
        :clazz="character?.classes?.[0]?.name || ''"
        :race-id="character?.race?.id"
        :gender="character?.gender"
        :src="character?.portrait"
      />

      <div class="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-2">
        <div class="text-white font-bold text-sm truncate">
          {{ character?.name }}
        </div>
        <div class="text-amber-300 text-xs">
          {{ character?.classes?.[0]?.name }} Lvl {{ character?.classes?.[0]?.level || 1 }}
        </div>
      </div>
      <div class="absolute top-0 left-100 right-0 p-2">
        <div class="text-red-400 font-bold text-sm mb-2">
          ❤️ {{ hp }}
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
import { computed } from 'vue';
import CharacterIllustration from './CharacterIllustration.vue';
import UiXpBar from '../ui/UiXpBar.vue';
import { useGameStore } from '../../stores/gameStore';
import { getCurrentLevel, getXpProgress } from '../../utils/dndLevels';

const gameStore = useGameStore();
const character = computed(() => gameStore.session.character);

const hp = computed(() => {
    if (!character.value) return '0/0';
    return `${character.value.hp || 0}/${character.value.hpMax || 12}`;
});

const currentLevel = computed(() => {
    const xp = character.value?.totalXp || 0;
    const level = getCurrentLevel(xp);
    return `Level ${level.level}`;
});

const xpPercent = computed(() => {
    const xp = character.value?.totalXp || 0;
    const progress = getXpProgress(xp);
    return progress.percentage;
});
</script>

<style scoped>
.aspect-square {
    aspect-ratio: 1 / 1;
}
</style>
