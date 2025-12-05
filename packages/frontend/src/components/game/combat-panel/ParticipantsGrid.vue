<template>
  <div class="-mx-1 px-1">
    <div class="flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible overflow-y-hidden">
      <div
        v-for="(p, idx) in enemies"
        :key="p.id || idx"
        class="shrink-0 p-1"
        :style="{ width: '120px', height: '120px' }"
        :data-cy="p.id"
      >
        <FighterPortrait
          :fighter="p"
          :is-player="false"
        />
      </div>
      <div>
        <div
          v-if="currentCharacter"
          class="shrink-0 p-1"
          :style="{ width: '120px', height: '120px' }"
          data-cy="current-player-portrait"
        >
          <FighterPortrait
            :fighter="null"
            :is-player="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { storeToRefs } from 'pinia';
import FighterPortrait from '../FighterPortrait.vue';

defineEmits<(e: 'acted', payload?: unknown) => void>();

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const combatStore = useCombatStore();
const { enemies } = storeToRefs(combatStore);

</script>
