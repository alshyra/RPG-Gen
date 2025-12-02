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
          <div
            class="ml-2 text-sm text-slate-400"
            data-cy="combat-round"
          >
            Round {{ roundNumber }}
          </div>
          <!-- Action Economy Display -->
          <div class="ml-auto flex items-center gap-3 text-sm">
            <div
              class="flex items-center gap-1"
              data-cy="action-counter"
              :class="combatStore.actionRemaining > 0 ? 'text-green-400' : 'text-slate-500'"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
              </svg>
              <span>{{ combatStore.actionRemaining }}</span>
            </div>
            <div
              class="flex items-center gap-1"
              data-cy="bonus-action-counter"
              :class="combatStore.bonusActionRemaining > 0 ? 'text-amber-400' : 'text-slate-500'"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
              </svg>
              <span>{{ combatStore.bonusActionRemaining }}</span>
            </div>
            <!-- Combat Phase -->
            <div
              class="px-2 py-0.5 rounded text-xs font-medium"
              data-cy="combat-phase"
              :class="phaseClass"
            >
              {{ phaseLabel }}
            </div>
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
          <!-- Turn order display (compact) -->
          <div class="mb-2">
            <div
              data-cy="turn-order"
              class="flex gap-2 items-center text-xs overflow-auto"
            >
              <template
                v-for="(t, i) in turnOrder"
                :key="t.id"
              >
                <div
                  :data-cy="t.isPlayer ? 'turn-order-player' : ('turn-order-' + i)"
                  :class="['px-2 py-1 rounded', currentTurnIndex === i ? 'ring-2 ring-amber-400' : 'bg-slate-800']"
                >
                  <span v-text="t.name" />
                  <div
                    v-if="currentTurnIndex === i"
                    data-cy="current-activation"
                    class="sr-only"
                  >
                    current
                  </div>
                </div>
              </template>
            </div>
          </div>

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

        <!-- End Turn Button -->
        <div class="flex justify-end mt-2">
          <button
            data-cy="end-turn-button"
            class="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            :class="endTurnButtonClass"
            :disabled="!canEndTurn || isEndingTurn"
            @click="onEndTurn"
          >
            <span v-if="isEndingTurn">En cours...</span>
            <span v-else>Fin de tour</span>
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Roll modal (server requested roll) - delegated to autonomous component -->
  <RollDamageModal />

  <!-- Attack result modal - teleported to body to avoid pointer-events:none inheritance -->
  <Teleport to="body">
    <div
      v-if="showAttackResultModal"
      class="fixed inset-0 z-70 flex items-center justify-center"
    >
      <div
        data-cy="attack-result-modal"
        class="bg-slate-900 border border-slate-700 p-4 rounded shadow-lg w-96"
      >
        <div class="text-lg font-semibold mb-2">
          Attack Result
        </div>
        <pre class="text-sm text-slate-200 mb-3">{{ currentAttackResult }}</pre>
        <div class="flex justify-end">
          <button
            class="px-3 py-1 rounded bg-emerald-600"
            @click="closeAttackResult"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </Teleport>

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
import {
  computed, ref, nextTick, watch, onMounted, onBeforeUnmount,
} from 'vue';
import { combatService } from '@/apis/combatApi';
import FighterPortrait from './FighterPortrait.vue';
import RollDamageModal from './RollDamageModal.vue';
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

const {
  inCombat, roundNumber, phase,
} = storeToRefs(combatStore);

// Expose turn order and index from the store for the template
const {
  turnOrder,
  currentTurnIndex: storeCurrentTurnIndex,
  expectedDto,
  showAttackResultModal,
  currentAttackResult,
} = storeToRefs(combatStore);

const currentTurnIndex = computed(() => storeCurrentTurnIndex.value ?? 0);

// Show a simple roll modal when the server expects a roll or when phase requests it
const showRollModal = computed(() => {
  console.log('[CombatPanel] showRollModal check:', {
    expectedDto: expectedDto.value,
    phase: phase.value,
    result: (expectedDto.value && expectedDto.value !== 'AttackRequestDto') || phase.value === 'AWAITING_DAMAGE_ROLL',
  });
  return (expectedDto.value && expectedDto.value !== 'AttackRequestDto') || phase.value === 'AWAITING_DAMAGE_ROLL';
});

const { enemies } = combatStore;

const isEndingTurn = ref(false);

// Phase display
const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN': return 'Your Turn';
    case 'AWAITING_DAMAGE_ROLL': return 'Roll Damage';
    case 'ENEMY_TURN': return 'Enemy Turn';
    case 'COMBAT_ENDED': return 'Combat Over';
    default: return 'Your Turn';
  }
});

const phaseClass = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN': return 'bg-green-600 text-white';
    case 'AWAITING_DAMAGE_ROLL': return 'bg-amber-600 text-white';
    case 'ENEMY_TURN': return 'bg-red-600 text-white';
    case 'COMBAT_ENDED': return 'bg-slate-600 text-white';
    default: return 'bg-green-600 text-white';
  }
});

// Can end turn only during player turn
const canEndTurn = computed(() => phase.value === 'PLAYER_TURN' && !isEndingTurn.value);

const endTurnButtonClass = computed(() => {
  if (!canEndTurn.value) {
    return 'bg-slate-600 text-slate-400 cursor-not-allowed';
  }
  return 'bg-purple-600 hover:bg-purple-700 text-white';
});

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
  enemyList.forEach((e, i) => list.push({
    ...e,
    isPlayer: false,
    enemyOrdinal: i,
  } as Participant & { enemyOrdinal: number }));

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
  nextTick()
    .then(updateHeight);
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
  // Do not refresh status if we're waiting for a damage roll
  // (this would reset the expectedDto and close the roll modal)
  if (combatStore.phase === 'AWAITING_DAMAGE_ROLL' || combatStore.expectedDto === 'DiceThrowDto') {
    console.log('[CombatPanel] onActorActed skipped - awaiting damage roll');
    return;
  }

  // Do not rotate client-side; refresh authoritative combat state from backend.
  if (!characterStore.currentCharacter) return;
  try {
    await combatStore.fetchStatus(characterStore.currentCharacter.characterId);
  } catch (e) {
    console.error('Failed to refresh combat status after action', e);
  }
};

const onEndTurn = async () => {
  if (!characterStore.currentCharacter || isEndingTurn.value) return;

  try {
    isEndingTurn.value = true;
    await combatStore.endActivation(characterStore.currentCharacter.characterId);
  } catch (e) {
    console.error('Failed to end turn', e);
  } finally {
    isEndingTurn.value = false;
  }
};

const closeAttackResult = () => {
  combatStore.closeAttackResultModal();
};

const closeRollModal = async () => {
  // refresh status to clear expectedDto if server moved on
  if (!characterStore.currentCharacter) return;
  await combatStore.fetchStatus(characterStore.currentCharacter.characterId);
};

const sendRollResult = async () => {
  if (!characterStore.currentCharacter) return;
  try {
    const charId = characterStore.currentCharacter.characterId;
    const token = combatStore.actionToken;
    if (!token) {
      console.error('No action token available to resolve roll');
      return;
    }

    // Send a dummy DiceThrowDto using the current target and a small roll
    const payload = {
      rolls: [3],
      mod: 0,
      total: 3,
      action: 'damage',
      target: combatStore.currentTarget?.name ?? '',
    };

    const result = await combatService.resolveRollWithToken(charId, token, payload as any);

    // Update combat store with the result (preserves phase info before fetchStatus)
    if (result) {
      combatStore.updateFromTurnResult(result);
    }

    // Now fetch fresh status to get a new action token
    await combatStore.fetchStatus(charId);
  } catch (e) {
    console.error('Failed to send roll result', e);
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
