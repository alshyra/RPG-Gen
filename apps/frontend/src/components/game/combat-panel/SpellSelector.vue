<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/60"
    @click.self="close"
  >
    <div class="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <h3 class="text-lg font-semibold text-slate-100 mb-4">Choisir une action</h3>

      <div class="text-xs text-slate-400 mb-4">
        Actions: {{ actionRemaining }} / {{ actionMax }}
      </div>

      <div class="space-y-2 mb-4">
        <UiButton
          class="w-full"
          :disabled="!canAct"
          :variant="canAct ? 'secondary' : 'ghost'"
          @click="attackWithWeapon"
        >
          ⚔️ Attaque à l'arme
        </UiButton>

        <div
          v-if="availableSpells.length > 0"
          class="space-y-2"
        >
          <p class="text-sm text-slate-400 mt-3 mb-2">Sorts disponibles:</p>
          <UiButton
            v-for="spell in availableSpells"
            :key="spell.name"
            :disabled="!canAct"
            :variant="canAct ? 'secondary' : 'ghost'"
            class="w-full"
            @click="castSpell(spell.name)"
          >
            <div class="flex items-center justify-between">
              <span>✨ {{ spell.name }}</span>
              <span
                class="text-xs"
                :class="canAct ? 'text-purple-200' : 'text-slate-500'"
                >Niv. {{ spell.level }}</span
              >
            </div>
            <div
              v-if="spell.description"
              class="text-xs mt-1"
              :class="canAct ? 'text-purple-200' : 'text-slate-500'"
            >
              {{ spell.description.substring(0, 60)
              }}{{ spell.description.length > 60 ? '...' : '' }}
            </div>
          </UiButton>
        </div>

        <p
          v-else
          class="text-sm text-slate-500 italic mt-3"
        >
          Aucun sort disponible
        </p>
      </div>
      <UiButton
        class="w-full px-4 py-2 mb-2"
        variant="primary"
        @click="onEndTurn"
      >
        Fin de tour
      </UiButton>
      <UiButton
        class="w-full px-4 py-2"
        :variant="'ghost'"
        @click="close"
      >
        Annuler
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '@rpg-gen/ui';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCombat } from '@/composables/useCombat';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatantDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  target: CombatantDto | null;
}>();
const characterStore = useCharacterStore();
const combatStore = useCombatStore();
const { endTurn } = useCombatEngine();
const { executeAttack } = useCombat();
const { currentCharacter } = storeToRefs(characterStore);
const { actionRemaining, actionMax } = storeToRefs(combatStore);

const emit = defineEmits<{
  close: [];
  attack: [target: CombatantDto, spellName?: string];
}>();

// Filter to only damaging spells (require meta.damageDice). Keep cantrips/low-level for UI where appropriate.
const availableSpells = computed(() => {
  if (!currentCharacter.value?.spells) return [];

  return currentCharacter.value.spells.filter(spell => !!(spell.meta && spell.meta.damageDice));
});

// Check if player can still act
const canAct = computed(() => (actionRemaining.value ?? 0) > 0);

const close = () => {
  emit('close');
};

const attackWithWeapon = () => {
  if (props.target && canAct.value) {
    emit('attack', props.target);
  }
  close();
};

const castSpell = async (spellName: string) => {
  if (!props.target || !canAct.value) throw new Error('No target or cannot act');
  await executeAttack(props.target, spellName);
  close();
};

const onEndTurn = () => {
  emit('close');
  endTurn();
};
</script>
