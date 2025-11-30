<template>
  <!-- Combat wrapper manages its own fixed positioning, header, bump and collapsed state -->
  <transition
    name="combat-panel"
    appear
  >
    <div
      v-if="inCombat && ui.isCombatOpen"
      class="inset-x-4 max-w-5xl mx-auto z-60 pointer-events-auto"
    >
      <div
        data-cy="combat-panel"
        class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full overflow-hidden rounded-t-lg rounded-b-none p-4"
      >
        <!-- Bump (visual) -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-6 bg-slate-900 border border-slate-700 rounded-t-full z-10 pointer-events-none" />

        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-slate-200 font-semibold">
            <svg
              class="w-4 h-4 text-amber-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 21l18-9L3 3v7l12 2-12 2v7z"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Combat</span>
          </div>
          <div class="ml-auto text-sm text-slate-400">
            Round {{ roundNumber }}
          </div>
        </div>

        <!-- Chevron/close button sitting above the bump -->
        <button
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          :aria-expanded="ui.isCombatOpen"
          aria-label="Masquer le panneau de combat"
          @click="ui.toggleCombat()"
        >
          <svg
            :class="['w-4 h-4 text-slate-200 transform-gpu transition-transform duration-250', ui.isCombatOpen ? 'rotate-180' : 'rotate-0']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 15l-6-6-6 6"
            />
          </svg>
        </button>

        <!-- Main panel content (existing card) -->
        <div
          class="card p-1 mb-2 max-h-44 overflow-y-auto mt-3"
          data-cy="combat-panel"
        >
          <!-- Participant tiles -->
          <div class="-mx-1 px-1">
            <div class="flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible overflow-y-hidden">
              <div
                v-for="(p, idx) in participants"
                :key="p.id || idx"
                class="shrink-0 p-1"
                :style="{ width: '120px', height: '120px' }"
                :data-cy="p.isPlayer ? 'player-portrait' : ('enemy-' + (p.enemyOrdinal ?? idx))"
              >
                <FighterPortrait
                  :enemy="p.isPlayer ? null : (p as unknown as any)"
                  :is-player="p.isPlayer"
                  @acted="onActorActed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- Collapsed handle (still visible when combat present) -->
  <transition name="combat-panel">
    <div
      v-if="inCombat && !ui.isCombatOpen"
      class="inset-x-4 max-w-5xl mx-auto z-60 pointer-events-auto"
    >
      <div class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full overflow-hidden rounded-t-lg h-10 flex items-center px-4">
        <!-- Bump -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-6 bg-slate-900 border border-slate-700 rounded-t-full z-10 pointer-events-none" />

        <div class="flex items-center gap-3 w-full">
          <div class="flex items-center gap-2 text-slate-200 font-semibold">
            <svg
              class="w-4 h-4 text-amber-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M3 21l18-9L3 3v7l12 2-12 2v7z"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Combat</span>
          </div>
          <div class="ml-auto text-sm text-slate-400">
            Round {{ roundNumber }}
          </div>
        </div>

        <button
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          :aria-expanded="ui.isCombatOpen"
          aria-label="Afficher le panneau de combat"
          @click="ui.toggleCombat()"
        >
          <svg
            :class="['w-4 h-4 text-slate-200 transform-gpu transition-transform duration-250', ui.isCombatOpen ? 'rotate-180' : 'rotate-0']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 15l-6-6-6 6"
            />
          </svg>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FighterPortrait from './FighterPortrait.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { useUiStore } from '@/stores/uiStore';
import type { CombatEnemyDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';

type Participant = {
  id?: string;
  name?: string;
  initiative?: number;
  isPlayer?: boolean;
  hp?: number;
  hpMax?: number | string;
  portrait?: string;
  enemyOrdinal?: number;
};

const combatStore = useCombatStore();
const characterStore = useCharacterStore();
const ui = useUiStore();

const { inCombat, roundNumber } = storeToRefs(combatStore);

const enemies = combatStore.enemies;

// Build participants array: player + enemies, ordered by initiative desc
const participants = computed(() => {
  const list: Participant[] = [];
  const player = characterStore.currentCharacter;
  if (player) {
    list.push({
      id: player.characterId,
      name: player.name,
      initiative: combatStore.playerInitiative ?? 0,
      isPlayer: true,
      hp: player.hp ?? 0,
      hpMax: player.hpMax ?? 0,
      portrait: player.portrait,
    });
  }

  const maybeRef = enemies as unknown as { value?: CombatEnemyDto[] };
  const enemyList: CombatEnemyDto[] = Array.isArray(maybeRef?.value) ? maybeRef.value! : Array.isArray(enemies) ? (enemies as unknown as CombatEnemyDto[]) : [];
  // Attach a stable enemyOrdinal (index among enemies) so tests can target them deterministically
  enemyList.forEach((e, i) => list.push({ ...e, isPlayer: false, enemyOrdinal: i } as Participant & { enemyOrdinal: number }));

  // sort by initiative desc (higher initiative acts first)
  list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
  return list;
});

const onActorActed = async (_actor: string) => {
  // Do not rotate client-side; refresh authoritative combat state from backend.
  if (!characterStore.currentCharacter) return;
  try {
    await combatStore.fetchStatus(characterStore.currentCharacter.characterId);
  } catch (e) {
    console.error('Failed to refresh combat status after action', e);
  }
};
</script>

<style scoped>
.combat-panel-enter-from,
.combat-panel-leave-to {
  transform: translateY(40px) scale(.985);
  opacity: 0;
}
.combat-panel-enter-to,
.combat-panel-leave-from {
  transform: translateY(0) scale(1);
  opacity: 1;
}
.combat-panel-enter-active,
.combat-panel-leave-active {
  transform-origin: bottom center;
  transition: transform 320ms cubic-bezier(.16,.84,.24,1), opacity 320ms cubic-bezier(.16,.84,.24,1);
}
</style>
