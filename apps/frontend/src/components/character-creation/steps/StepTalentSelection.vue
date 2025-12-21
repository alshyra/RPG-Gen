<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">Choisissez votre première Voie</h2>
    <p class="text-slate-400 text-sm">
      Chaque classe possède 3 voies de talents. Choisissez-en une pour débloquer son premier rang et 
      choisissez une statistique à améliorer (+1).
    </p>

    <!-- Loading state -->
    <div v-if="isLoadingVoies" class="py-8">
      <UiLoader />
    </div>

    <!-- Error state -->
    <div v-else-if="errorVoies" class="text-red-400 text-sm">
      Erreur lors du chargement des voies: {{ errorVoies.message }}
    </div>

    <!-- Voies selection -->
    <div v-else-if="voies && voies.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        v-for="(voie, index) in voies"
        :key="index"
        :class="[
          'relative p-4 rounded-lg border-2 transition-all',
          'hover:scale-105 hover:shadow-lg',
          selectedVoieIndex === index
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 bg-slate-800/60 hover:border-slate-600',
        ]"
        @click="selectVoie(index)"
      >
        <div class="font-bold text-lg mb-2">{{ voie.name }}</div>
        <div v-if="voie.ranks && voie.ranks.length > 0" class="mt-3 text-xs text-slate-500">
          Premier rang: {{ voie.ranks[0]?.aptitudeId || '?' }}
        </div>
        
        <!-- Selected indicator -->
        <div
          v-if="selectedVoieIndex === index"
          class="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
        >
          <span class="text-white text-sm">✓</span>
        </div>
      </button>
    </div>

    <!-- Stat selection (only if voie selected) -->
    <div v-if="selectedVoieIndex !== null" class="mt-6">
      <h3 class="font-bold mb-3">Choisissez une statistique à améliorer (+1)</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="stat in stats"
          :key="stat.key"
          :class="[
            'p-3 rounded-lg border-2 transition-all',
            'hover:scale-105',
            selectedStat === stat.key
              ? 'border-green-500 bg-green-500/10'
              : 'border-slate-700 bg-slate-800/60 hover:border-slate-600',
          ]"
          @click="selectedStat = stat.key"
        >
          <div :class="['font-bold', stat.color]">{{ stat.icon }} {{ stat.name }}</div>
          <div class="text-xs text-slate-400 mt-1">+1</div>
          
          <!-- Selected indicator -->
          <div
            v-if="selectedStat === stat.key"
            class="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
          >
            <span class="text-white text-xs">✓</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Selection summary -->
    <div v-if="selectedVoieIndex !== null && selectedStat" class="mt-4 p-4 bg-slate-800/50 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-slate-400">Voie sélectionnée:</span>
          <span class="ml-2 font-bold text-indigo-400">
            {{ voies?.[selectedVoieIndex]?.name }}
          </span>
        </div>
        <div>
          <span class="text-slate-400">Stat bonus:</span>
          <span class="ml-2 font-bold text-green-400">
            +1 {{ stats.find(s => s.key === selectedStat)?.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTalentTrees } from '@rpg-gen/api-client';
import { UiLoader } from '@rpg-gen/ui';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';

const currentCharacter = useCurrentCharacter();

// Stat options
const stats = [
  { key: 'vigor', name: 'Vigueur', icon: '💪', color: 'text-red-400' },
  { key: 'finesse', name: 'Finesse', icon: '🎯', color: 'text-green-400' },
  { key: 'mind', name: 'Esprit', icon: '🧠', color: 'text-blue-400' },
  { key: 'survival', name: 'Survie', icon: '🛡️', color: 'text-yellow-400' },
] as const;

// Local state
const selectedVoieIndex = ref<number | null>(null);
const selectedStat = ref<string | null>(null);

// Fetch talent trees for the selected class
const className = computed(() => currentCharacter.value?.className || 'guerrier');
const { data: voies, isLoading: isLoadingVoies, error: errorVoies } = useTalentTrees(className);

// Emit changes to parent for reactive validation
const emit = defineEmits<{
  'update:isValid': [boolean];
  'update:selections': [{ voieIndex: number; voieName: string; statBonus: string }];
}>();

// Watch for changes and emit to parent
watch([selectedVoieIndex, selectedStat], () => {
  const isValid = selectedVoieIndex.value !== null && selectedStat.value !== null;
  emit('update:isValid', isValid);
  
  if (isValid) {
    emit('update:selections', {
      voieIndex: selectedVoieIndex.value!,
      voieName: voies.value?.[selectedVoieIndex.value!]?.name || '',
      statBonus: selectedStat.value!,
    });
  }
});

const selectVoie = (index: number) => {
  selectedVoieIndex.value = index;
};
</script>
