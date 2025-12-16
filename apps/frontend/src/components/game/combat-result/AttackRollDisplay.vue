<template>
  <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
    <div
      v-if="attackResult?.diceResult"
      class="text-white"
    >
      <div class="text-lg font-semibold mb-2">Jet d'attaque</div>
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold">{{ attackResult.diceResult.total }}</span>
        <span class="text-slate-400">
          ({{ attackResult.diceResult.rolls.join(" + ") }} +
          {{ attackResult.diceResult.modifierValue }})
        </span>
      </div>
      <div
        v-if="attackResult.isCrit"
        class="text-yellow-400 font-bold mt-1"
      >
        ⚔️ CRITIQUE!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCombat } from "@rpg-gen/api-client";
import { useCharacterId } from "@/composables/useCharacterId";
import { computed } from "vue";

const characterId = useCharacterId();
const combatApi = useCombat(characterId);
const attackResult = computed(() => combatApi.attack.data.value);
</script>

<style scoped></style>
