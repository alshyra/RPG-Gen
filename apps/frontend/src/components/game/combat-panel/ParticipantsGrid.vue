<template>
  <div class="-mx-1 px-1">
    <div
      class="flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible overflow-y-hidden"
    >
      <div
        v-for="(p, idx) in enemies"
        :key="p.id || idx"
        class="shrink-0 p-1"
        :style="{ width: '120px', height: '120px' }"
        :data-cy="`enemy-${idx}`"
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
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCombat } from '@rpg-gen/api-client';
import { computed } from 'vue';
import FighterPortrait from '../FighterPortrait.vue';
import { useCharacterId } from '@/composables/useCharacterId';

defineEmits<(e: 'acted', payload?: unknown) => void>();

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const { status } = useCombat(characterId);

const enemies = computed(() => status.data.value?.enemies || []);
</script>
