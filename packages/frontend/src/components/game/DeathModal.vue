<template>
  <UiModal
    :is-open="isOpen"
    @close="close"
  >
    <template #header>
      <div class="text-center mb-6">
        <h2 class="text-4xl font-black text-red-500 mb-2">
          ⚰️ Fin du Voyage
        </h2>
        <div class="text-sm text-slate-400">
          {{ characterName }} a succombé...
        </div>
      </div>
    </template>

    <!-- Death Message -->
    <div class="bg-slate-700/50 rounded-lg p-4 mb-6 border border-red-500/30">
      <p class="text-center text-slate-200 mb-2">
        Votre aventurier a atteint 0 point de vie et a quitté ce monde.
      </p>
      <div class="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-600">
        <p>{{ characterName }}</p>
        <p v-if="characterClass">
          {{ characterClass }}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          {{ diedDate }}
        </p>
      </div>
    </div>

    <!-- Stats on death -->
    <div class="bg-slate-700/30 rounded-lg p-3 mb-6 text-xs text-slate-300 space-y-1">
      <div>XP gagné: <span class="text-amber-400">{{ characterXp }}</span></div>
      <div>Niveau atteint: <span class="text-amber-400">{{ characterLevel }}</span></div>
    </div>

    <template #footer>
      <div class="flex">
        <UiButton
          @click="confirmDeath"
        >
          Retour à l'accueil
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiModal from '../ui/UiModal.vue';
import { getCurrentLevel } from '../../utils/dndLevels';
import { storeToRefs } from 'pinia';
import { useCharacterStore } from '@/stores/characterStore';
import UiButton from '../ui/UiButton.vue';

interface Props { isOpen: boolean }

interface Emits {
  confirm: [];
  close: [];
}

const { isOpen } = defineProps<Props>();
const emit = defineEmits<Emits>();
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const characterName = computed(() => currentCharacter.value?.name || 'Unknown');
const characterClass = computed(() => {
  const classes = currentCharacter.value?.classes || [];
  return classes.map(c => `${c.name} ${c.level}`)
    .join(', ') || '';
});
const characterXp = computed(() => currentCharacter.value?.totalXp || 0);
const characterLevel = computed(() => getCurrentLevel(currentCharacter.value?.totalXp || 0).level);
const diedDate = computed(() => new Date()
  .toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }));

const close = () => emit('close');
const confirmDeath = () => emit('confirm');
</script>

<style scoped></style>
