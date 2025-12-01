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
        class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full rounded-t-lg rounded-b-none p-4"
      >
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

        <button
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md border-b-0 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
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
        <div
          class="card p-1 mb-2 max-h-44 mt-3"
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
  <transition name="combat-handle">
    <div
      v-if="inCombat && !ui.isCombatOpen"
      class="transition-all duration-700 inset-x-4 max-w-5xl mx-auto z-60 pointer-events-auto"
    >
      <div class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full rounded-t-lg h-10 flex items-center px-4">
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
import { computed, ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import FighterPortrait from './FighterPortrait.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { useUiStore } from '@/stores/uiStore';
import type { CombatEnemyDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';

interface Participant {
  id?: string;
  name?: string;
  initiative?: number;
  isPlayer?: boolean;
  hp?: number;
  hpMax?: number | string;
  portrait?: string;
  enemyOrdinal?: number;
}

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
  const enemyList: CombatEnemyDto[] = Array.isArray(maybeRef?.value) ? maybeRef.value : Array.isArray(enemies) ? (enemies as unknown as CombatEnemyDto[]) : [];
  // Attach a stable enemyOrdinal (index among enemies) so tests can target them deterministically
  enemyList.forEach((e, i) => list.push({ ...e, isPlayer: false, enemyOrdinal: i } as Participant & { enemyOrdinal: number }));

  // sort by initiative desc (higher initiative acts first)
  list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
  return list;
});

// Measure expanded panel height and animate max-height (Accordion-like behavior)
const containerEl = ref<HTMLElement | null>(null);
const height = ref<number>(0);

const updateHeight = () => {
  if (containerEl.value) height.value = containerEl.value.scrollHeight;
};

onMounted(() => {
  nextTick().then(updateHeight);
  window.addEventListener('resize', updateHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeight);
});

// Recompute height when participants or open state change
watch([
  () => participants.value.length,
  () => ui.isCombatOpen,
], async () => {
  await nextTick();
  updateHeight();
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
  max-height: 0;
  opacity: 0;
}
.combat-panel-enter-from {
  max-height: 0;
  opacity: 0;
}
.combat-panel-enter-to,
.combat-panel-leave-from {
  opacity: 1;
}
.combat-panel-enter-active,
.combat-panel-leave-active {
  transition: max-height 320ms cubic-bezier(.16,.84,.24,1), opacity 220ms ease;
  will-change: max-height, opacity;
}

/* Collapsed handle: shrink/grow opposite to the main panel */
.combat-handle-enter-from,
.combat-handle-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.combat-handle-enter-to,
.combat-handle-leave-from {
  max-height: 64px; /* enough to show the 40px handle comfortably */
  opacity: 1;
}
.combat-handle-enter-active,
.combat-handle-leave-active {
  transition: max-height 280ms cubic-bezier(.16,.84,.24,1), opacity 160ms ease;
  will-change: max-height, opacity;
}
</style>
