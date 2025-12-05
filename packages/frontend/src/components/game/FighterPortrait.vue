<template>
  <div
    class="fighter-card relative bg-slate-800/40 rounded overflow-hidden flex items-stretch"
    :data-cy="isPlayer ? 'player-portrait' : ('enemy-portrait-' + fighter?.id)"
  >
    <div class="relative w-full h-full">
      <img
        :src="resolvedPortrait"
        class="absolute inset-0 w-full h-full object-cover"
        alt="portrait"
      >

      <div class="absolute top-1 left-1 bg-black/25 text-[10px] text-white px-1.5 py-0.5 rounded">
        <div
          v-if="!isPlayer"
          class="font-medium"
        >
          {{ title }}
        </div>
        <div
          v-if="ac!= '-'"
          class="text-[10px] text-slate-200"
        >
          AC: {{ ac ?? '-' }}
        </div>
      </div>

      <div class="absolute bottom-1 left-1 right-1 flex items-center justify-center">
        <div class="mx-2 pointer-events-auto">
          <button
            v-if="showAttackButton"
            class="px-2 py-0.5 text-[11px] rounded bg-amber-400 hover:bg-amber-300 text-amber-900"
            data-cy="attack-button"
            @click.prevent="doAttack"
          >
            Attaquer
          </button>
          <div
            v-else
            class="px-2 py-0.5 text-[11px] rounded bg-slate-600 text-slate-200"
          >
            {{ altLabel }}
          </div>
        </div>
      </div>

      <div class="absolute inset-y-2 right-1 flex items-center pointer-events-none">
        <div
          class="relative w-3 h-full bg-slate-700 rounded overflow-hidden"
          data-cy="hp-bar"
          :data-hp="String(fighterDisplayHp)"
        >
          <div
            class="absolute left-0 right-0 bottom-0 bg-linear-to-t from-red-600 to-red-400"
            :style="{ height: hpPct }"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-[9px] font-mono text-white transform -rotate-90 whitespace-nowrap">
              {{ fighterDisplayHp }} / {{ fighterDisplayMaxHp }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref,
} from 'vue';
import { useCombat } from '@/composables/useCombat';
import type { CombatantDto } from '@rpg-gen/shared';
import { useCharacterStore } from '@/stores/characterStore';
import {
  pickBestPortrait, getFallbackPortrait,
} from '@/composables/usePortraits';
import { useCombatStore } from '@/stores/combatStore';
import { storeToRefs } from 'pinia';

const {
  fighter, isPlayer,
} = defineProps<{
  fighter: CombatantDto | null;
  isPlayer?: boolean;
}>();
const combatStore = useCombatStore();
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const {
  player: combatPlayer, inCombat,
} = storeToRefs(combatStore);
const combat = useCombat();

const title = computed(() => (isPlayer ? (currentCharacter.value?.name ?? 'You') : (fighter?.name ?? 'Enemy')));
// For player, get AC from combat state player (calculated server-side); for enemies, use fighter.ac
const ac = computed(() => (isPlayer ? (combatPlayer.value?.ac ?? '-') : (fighter?.ac ?? '-')));
const fighterDisplayHp = computed(() => {
  if (isPlayer && inCombat.value && combatPlayer.value) return combatPlayer.value.hp ?? 0;
  if (isPlayer) return currentCharacter.value?.hp ?? 0;
  return fighter?.hp ?? 0;
});
const fighterDisplayMaxHp = computed(() => {
  if (isPlayer && inCombat.value && combatPlayer.value) return combatPlayer.value.hpMax ?? '-';
  if (isPlayer) return currentCharacter.value?.hpMax ?? '-';
  return fighter?.hpMax ?? '-';
});
const hpPct = computed(() => {
  const hp = Number(fighterDisplayHp.value || 0);
  const max = typeof fighterDisplayMaxHp.value === 'number' ? Number(fighterDisplayMaxHp.value) : undefined;
  if (!max || max <= 0) return '0%';
  return ((Math.max(0, hp) / max) * 100) + '%';
});

const resolvedPortrait = ref<string>(`/images/enemies/enemy.png`);

onMounted(async () => {
  if (isPlayer) {
    resolvedPortrait.value = currentCharacter.value?.portrait || `/images/enemies/hero.png`;
    return;
  }
  if (!fighter) {
    resolvedPortrait.value = `/images/enemies/enemy.png`;
    return;
  }
  const byManifest = await pickBestPortrait(fighter.name || fighter.id || 'enemy');
  resolvedPortrait.value = byManifest || getFallbackPortrait(fighter.name || fighter.id || 'enemy');
});

const showAttackButton = computed(() => !isPlayer && (fighter?.hp ?? 0) > 0);
const altLabel = computed(() => isPlayer ? 'Vous' : 'Mort');

const doAttack = async () => {
  if (!fighter || !currentCharacter.value?.characterId) return;
  await combat.executeAttack(fighter);
};
</script>

<style scoped>
.fighter-card { width: 120px; height: 120px; }
.fighter-card img { object-position: center top; }
.fighter-card .font-medium { font-size: 0.78rem; }
.fighter-card .text-xs { font-size: 0.68rem; }
</style>
