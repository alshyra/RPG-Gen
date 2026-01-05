<template>
  <div class="h-full flex flex-col">
    <h3 class="text-lg font-semibold mb-4 text-center">Choisissez votre race</h3>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex-1 flex items-center justify-center"
    >
      <UiLoader />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex-1 flex items-center justify-center text-red-400"
    >
      <p>Erreur lors du chargement des races</p>
    </div>

    <!-- Race cards -->
    <div
      v-else
      class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
    >
      <button
        v-for="race in races"
        :key="race.id"
        type="button"
        :class="[
          'relative p-4 lg:p-6 rounded-xl border-2 transition-all duration-200',
          'flex flex-col items-center text-center',
          'hover:scale-[1.02] hover:shadow-lg',
          selectedRace === race.id
            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50'
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500',
        ]"
        @click="selectRace(race.id)"
      >
        <!-- Race icon -->
        <div
          class="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-3xl lg:text-4xl mb-3"
          :style="{ backgroundColor: race.color + '20' }"
        >
          {{ race.icon }}
        </div>

        <!-- Race name -->
        <h4
          class="text-lg lg:text-xl font-bold mb-2"
          :style="{ color: race.color }"
        >
          {{ race.name }}
        </h4>

        <!-- Trait -->
        <div class="text-sm font-medium text-indigo-400 mb-1">
          {{ race.trait }}
        </div>

        <!-- Trait effect -->
        <p class="text-xs text-slate-400 mb-3">
          {{ race.descriptionForAi }}
        </p>

        <!-- Stat bonuses -->
        <div class="w-full flex flex-wrap justify-center gap-1 text-xs">
          <span
            v-if="race.bonuses?.vigor"
            class="bg-red-500/20 text-red-400 px-2 py-1 rounded"
          >
            +{{ race.bonuses.vigor }} Vigueur
          </span>
          <span
            v-if="race.bonuses?.finesse"
            class="bg-green-500/20 text-green-400 px-2 py-1 rounded"
          >
            +{{ race.bonuses.finesse }} Finesse
          </span>
          <span
            v-if="race.bonuses?.mind"
            class="bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
          >
            +{{ race.bonuses.mind }} Esprit
          </span>
          <span
            v-if="race.bonuses?.survival"
            class="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded"
          >
            +{{ race.bonuses.survival }} Survie
          </span>
        </div>

        <!-- Selected indicator -->
        <div
          v-if="selectedRace === race.id"
          class="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
        >
          <span class="text-white text-sm">✓</span>
        </div>
      </button>
    </div>

    <!-- Selection confirmation -->
    <div
      v-if="selectedRace && selectedRaceData"
      class="mt-4 p-4 bg-slate-800/50 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <div>
          <span class="text-slate-400">Race sélectionnée:</span>
          <span
            class="ml-2 font-bold"
            :style="{ color: selectedRaceData.color }"
          >
            {{ selectedRaceData.icon }} {{ selectedRaceData.name }}
          </span>
        </div>
        <div class="text-sm text-slate-500">
          {{ selectedRaceData.trait }}: {{ selectedRaceData.traitEffect }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterId } from "@/composables/useCharacterId";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useAvailableRaces, useSelectRace, useCharacter, RaceMetadata, type RaceId } from "@rpg-gen/api-client";
import { UiLoader } from "@rpg-gen/ui";
import { computed, ref, watch } from "vue";

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();

// API calls
const { data: races, isLoading, error } = useAvailableRaces();
const selectRaceMutation = useSelectRace(characterId);
const { character } = useCharacter(characterId);

// Local state - using RaceId type for type safety
const selectedRace = ref<RaceId | null>(null);

// Initialize from existing character data
watch(
  () => currentCharacter.value?.raceId,
  (raceId) => {
    if (raceId) {
      selectedRace.value = raceId;
    }
  },
  { immediate: true },
);

// Computed
const selectedRaceData = computed<RaceMetadata | undefined>(() => {
  if (!selectedRace.value || !races.value) return undefined;
  return races.value.find((r) => r.id === selectedRace.value);
});

// Type guard to validate raceId
function isValidRaceId(id: string): id is RaceId {
  return ["humain", "nain", "elfe", "dark_elfe", "orc"].includes(id);
}

// Methods
async function selectRace(raceId: string) {
  if (!isValidRaceId(raceId)) {
    console.error("Invalid race ID:", raceId);
    return;
  }
  selectedRace.value = raceId;

  // Call API to select race
  try {
    await selectRaceMutation.mutateAsync(raceId);
    // Refetch character data explicitly to ensure UI updates immediately
    await character.refetch();
  } catch (e) {
    console.error("Failed to select race:", e);
    // Reset selection on error
    selectedRace.value = currentCharacter.value?.raceId || null;
  }
}

// Expose selected race for parent validation
defineExpose({
  selectedRace,
  isValid: computed(() => !!selectedRace.value),
});
</script>
