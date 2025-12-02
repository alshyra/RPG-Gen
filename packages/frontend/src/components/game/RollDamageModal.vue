<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-cy="roll-damage-modal"
      class="fixed inset-0 z-70 flex items-center justify-center"
    >
      <div class="bg-slate-900 border border-slate-700 p-4 rounded shadow-lg w-96">
        <div class="text-lg font-semibold mb-2">
          Roll Damage
        </div>

        <p class="text-sm text-slate-300 mb-2">
          {{ description }}
        </p>

        <!-- Attack roll display (if available) -->
        <div class="bg-slate-800/50 rounded p-3 mb-3">
          <div class="text-sm text-slate-400 mb-1">
            Jet d'attaque
          </div>
          <div class="flex items-center gap-3">
            <div
              data-cy="roll-attack-roll"
              class="w-12 h-12 rounded flex items-center justify-center bg-slate-700 text-2xl font-bold text-amber-300"
            >
              {{ attackRollDisplay }}
            </div>
            <div class="text-sm text-slate-300">
              + {{ attackBonusDisplay }} → <span class="text-2xl font-bold text-amber-300">{{ totalAttackDisplay }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mb-2">
          <div class="text-sm text-slate-400">
            Dés: {{ pending?.dices ?? '-' }} <span v-if="pending?.advantage">({{ pending.advantage }})</span>
          </div>
          <div class="flex gap-2">
            <button
              data-cy="do-roll"
              class="px-3 py-1 rounded bg-emerald-600 text-white"
              :disabled="isRolling || hasRolled"
              @click="doRollAction"
            >
              <span v-if="isRolling">Rolling...</span>
              <span v-else-if="hasRolled">Rolled</span>
              <span v-else>Roll</span>
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="px-3 py-1 rounded bg-slate-700"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            data-cy="send-roll-result"
            class="px-3 py-1 rounded bg-amber-500 text-black"
            :disabled="!hasRolled"
            @click="onSend"
          >
            Send Result
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { combatService } from '@/apis/combatApi';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { useGameStore } from '@/stores/gameStore';
import { DiceThrowDto } from '@rpg-gen/shared';
import { Teleport, computed, ref } from 'vue';

const gameStore = useGameStore();
const combatStore = useCombatStore();
const characterStore = useCharacterStore();

const isOpen = computed(() => (combatStore.expectedDto && combatStore.expectedDto !== 'AttackRequestDto') || combatStore.phase === 'AWAITING_DAMAGE_ROLL');

const pending = computed(() => gameStore.pendingInstruction);

const description = computed(() => {
  if (pending.value?.type === 'roll' && pending.value.description) {
    return pending.value.description;
  }
  if (pending.value?.type === 'roll' && pending.value?.meta?.target) {
    return `Attack vs ${pending.value.meta.target}`;
  }
  return 'Server requested a damage roll';
});

const rollResult = ref<DiceThrowDto | null>(null);
const isRolling = ref(false);

const hasRolled = computed(() => !!rollResult.value);

const attackRollDisplay = computed(() => {
  if (rollResult.value && Array.isArray(rollResult.value.rolls) && rollResult.value.rolls.length > 0) return String(rollResult.value.rolls[0]);
  if (!pending.value || pending.value.type !== 'roll') return '-';
  const attackRoll = pending.value?.meta?.attackRoll;
  return (attackRoll === undefined || attackRoll === null) ? '-' : String(attackRoll);
});

const attackBonusDisplay = computed(() => pending.value?.type === 'roll' ? pending.value?.meta?.attackBonus : 0);
const totalAttackDisplay = computed(() => {
  const totalFromRoll = rollResult.value?.total;
  if (totalFromRoll !== undefined && totalFromRoll !== null) return String(totalFromRoll + (pending.value?.meta?.attackBonus ?? 0));
  const a = pending.value?.meta?.attackRoll ?? 0;
  const b = pending.value?.meta?.attackBonus ?? 0;
  if (a === undefined || a === null) return '-';
  return String(a + b);
});

const onCancel = async () => {
  if (!characterStore.currentCharacter) return;
  await combatStore.fetchStatus(characterStore.currentCharacter.characterId);
};

// When this modal opens, ensure any queued/other attack-result modals are closed
// to avoid visual stacking of multiple overlays.
import { watch } from 'vue';
watch(isOpen, (open) => {
  if (open) {
    try {
      combatStore.closeAttackResultModal();
    } catch (e) {
      // ignore
    }
  }
});

const doRollAction = async () => {
  if (!pending.value) return;
  isRolling.value = true;
  try {
    const expr = pending.value.dices ?? '1d20';
    const adv = pending.value.advantage;
    const res = await gameStore.doRoll(expr, adv);
    // store local roll result
    rollResult.value = res;
  } catch (e) {
    console.error('Failed to roll dice', e);
  } finally {
    isRolling.value = false;
  }
};

const buildRollPayload = (r: DiceThrowDto) => ({
  rolls: r.rolls,
  mod: r.mod ?? 0,
  total: r.total,
  action: 'damage',
  target: combatStore.currentTarget?.name ?? pending.value?.meta?.target ?? '',
});

const sendRollResult = async (charId: string, token: string, payload: DiceThrowDto) => {
  try {
    const result = await combatService.resolveRollWithToken(charId, token, payload);
    if (result) {
      combatStore.updateFromTurnResult(result);
    }
    await combatStore.fetchStatus(charId);
  } catch (e) {
    console.error('Failed to send roll result', e);
  }
};

const onSend = async () => {
  if (!characterStore.currentCharacter) return;
  const charId = characterStore.currentCharacter.characterId;
  const token = combatStore.actionToken;
  if (!token) {
    console.error('No action token available to resolve roll');
    return;
  }
  if (!rollResult.value) {
    console.error('No roll result available to send');
    return;
  }

  const payload = buildRollPayload(rollResult.value);
  await sendRollResult(charId, token, payload);
};
</script>

<style scoped>
.roll-dialog-enter-active, .roll-dialog-leave-active { transition: opacity 180ms ease; }
.roll-dialog-enter-from, .roll-dialog-leave-to { opacity: 0; }
</style>
