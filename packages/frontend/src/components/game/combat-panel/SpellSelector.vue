<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/60"
    @click.self="close"
  >
    <div class="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <h3 class="text-lg font-semibold text-slate-100 mb-4">
        Choisir une action
      </h3>

      <div class="space-y-2 mb-4">
        <button
          class="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-amber-900 rounded-lg font-medium transition-colors"
          @click="attackWithWeapon"
        >
          ⚔️ Attaque à l'arme
        </button>

        <div
          v-if="availableSpells.length > 0"
          class="space-y-2"
        >
          <p class="text-sm text-slate-400 mt-3 mb-2">
            Sorts disponibles:
          </p>
          <button
            v-for="spell in availableSpells"
            :key="spell.name"
            class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-left"
            @click="castSpell(spell.name)"
          >
            <div class="flex items-center justify-between">
              <span>✨ {{ spell.name }}</span>
              <span class="text-xs text-purple-200">Niv. {{ spell.level }}</span>
            </div>
            <div
              v-if="spell.description"
              class="text-xs text-purple-200 mt-1"
            >
              {{ spell.description.substring(0, 60) }}{{ spell.description.length > 60 ? '...' : '' }}
            </div>
          </button>
        </div>

        <p
          v-else
          class="text-sm text-slate-500 italic mt-3"
        >
          Aucun sort disponible
        </p>
      </div>

      <button
        class="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        @click="close"
      >
        Annuler
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CombatantDto, SpellResponseDto } from '@rpg-gen/shared';
import { computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  target: CombatantDto | null;
  characterSpells: SpellResponseDto[];
}>();

const emit = defineEmits<{
  close: [];
  attack: [target: CombatantDto, spellName?: string];
}>();

// Filter to only offensive spells (cantrips and level 1 for MVP)
const availableSpells = computed(() => props.characterSpells.filter(spell => spell.level !== undefined && spell.level <= 1));

const close = () => {
  emit('close');
};

const attackWithWeapon = () => {
  if (props.target) {
    emit('attack', props.target);
  }
  close();
};

const castSpell = (spellName: string) => {
  if (props.target) {
    emit('attack', props.target, spellName);
  }
  close();
};
</script>
