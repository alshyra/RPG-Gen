<template>
  <div class="talent-tree-panel bg-slate-900/80 rounded-xl p-4 lg:p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-white">Arbre de Talents</h3>
      <div class="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
        <span class="text-yellow-400 text-lg">⭐</span>
        <span class="text-white font-bold">{{ talentPoints }}</span>
        <span class="text-slate-400 text-sm">points</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <UiLoader />
    </div>

    <!-- No class selected -->
    <div v-else-if="!className" class="text-center py-8 text-slate-400">
      <p>Sélectionnez d'abord une classe pour voir l'arbre de talents</p>
    </div>

    <!-- Talent Trees Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      <div
        v-for="voie in voies"
        :key="voie.voieId"
        class="voie-card bg-slate-800/50 rounded-xl p-4 border border-slate-700"
      >
        <!-- Voie Header -->
        <div class="text-center mb-4">
          <h4 class="text-lg font-bold text-indigo-400">{{ voie.voieName }}</h4>
          <div class="text-xs text-slate-500 mt-1">
            {{ voie.currentRank }}/5 rangs débloqués
          </div>
        </div>

        <!-- Ranks -->
        <div class="space-y-3">
          <button
            v-for="rank in 5"
            :key="rank"
            type="button"
            :disabled="!canUnlockRank(voie, rank)"
            :class="[
              'w-full p-3 rounded-lg transition-all duration-200 text-left',
              getRankButtonClasses(voie, rank),
            ]"
            @click="handleUnlockRank(voie.voieId, rank)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <!-- Rank indicator -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isRankUnlocked(voie, rank)
                      ? 'bg-green-500 text-white'
                      : canUnlockRank(voie, rank)
                        ? 'bg-yellow-500 text-black'
                        : 'bg-slate-700 text-slate-500',
                  ]"
                >
                  {{ rank }}
                </div>
                <!-- Aptitude info -->
                <div class="flex-1">
                  <div class="text-sm font-medium text-white">
                    {{ getAptitudeName(getAptitudeIdForRank(voie, rank)) }}
                  </div>
                  <div v-if="getAptitudeDescription(getAptitudeIdForRank(voie, rank))" class="text-xs text-slate-400 mt-0.5">
                    {{ getAptitudeDescription(getAptitudeIdForRank(voie, rank)) }}
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    {{ voie.ranks?.find(r => r.rank === rank)?.pointCost || 1 }} point{{ (voie.ranks?.find(r => r.rank === rank)?.pointCost || 1) > 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
              <!-- Status icon -->
              <div>
                <span v-if="isRankUnlocked(voie, rank)" class="text-green-400">✓</span>
                <span v-else-if="canUnlockRank(voie, rank)" class="text-yellow-400">⭐</span>
                <span v-else class="text-slate-600">🔒</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Unlock feedback -->
    <div
      v-if="unlockMutation.isPending.value"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-slate-800 rounded-xl p-6 text-center">
        <UiLoader />
        <p class="text-white mt-4">Déblocage en cours...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUnlockRank, useAptitudes } from "@rpg-gen/api-client";
import { UiLoader } from "@rpg-gen/ui";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCharacterId } from "@/composables/useCharacterId";

// Character data from backend
const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const unlockMutation = useUnlockRank(characterId.value!);

// Computed state
const className = computed(() => currentCharacter.value?.className);
const talentPoints = computed(() => currentCharacter.value?.talentPoints || 0);
const voies = computed(() => currentCharacter.value?.voies || []);
const isLoading = computed(() => !currentCharacter.value);

// Fetch aptitudes from API
const { data: aptitudesData } = useAptitudes();

// Build aptitude map for quick lookup
const aptitudeMap = computed(() => {
  const map = new Map<string, { name: string; description?: string }>();
  const aptitudes = aptitudesData.value;
  if (Array.isArray(aptitudes)) {
    aptitudes.forEach((apt) => {
      map.set(apt.id, { name: apt.name, description: apt.description });
    });
  }
  return map;
});

// Methods
function getAptitudeName(aptitudeId: string | undefined): string {
  if (!aptitudeId) return "À débloquer";
  return aptitudeMap.value.get(aptitudeId)?.name || aptitudeId;
}

function getAptitudeDescription(aptitudeId: string | undefined): string {
  if (!aptitudeId) return "";
  return aptitudeMap.value.get(aptitudeId)?.description || "";
}

function getAptitudeIdForRank(voie: { ranks?: Array<{ rank: number; aptitudeId: string }> }, rank: number): string | undefined {
  return voie.ranks?.find(r => r.rank === rank)?.aptitudeId;
}

function isRankUnlocked(voie: { currentRank: number }, rank: number): boolean {
  return voie.currentRank >= rank;
}

function canUnlockRank(voie: { currentRank: number; requiredTalentPoints?: number }, rank: number): boolean {
  // Already unlocked?
  if (isRankUnlocked(voie, rank)) return false;
  
  // Not enough points?
  const cost = voie.requiredTalentPoints ?? 1;
  if (talentPoints.value < cost) return false;
  
  // Rank 1 can always be unlocked (if points available)
  if (rank === 1) return true;
  
  // Higher ranks need previous rank unlocked
  return voie.currentRank === rank - 1;
}

function getRankButtonClasses(voie: { currentRank: number; requiredTalentPoints?: number }, rank: number): string {
  if (isRankUnlocked(voie, rank)) {
    return "bg-green-500/20 border border-green-500/50 cursor-default";
  }
  if (canUnlockRank(voie, rank)) {
    return "bg-yellow-500/10 border border-yellow-500/50 hover:bg-yellow-500/20 cursor-pointer";
  }
  return "bg-slate-700/30 border border-slate-600/30 cursor-not-allowed opacity-60";
}

async function handleUnlockRank(voieId: string, rank: number) {
  const voie = voies.value.find((v) => v.voieId === voieId);
  if (!voie || !canUnlockRank(voie, rank)) return;
  
  try {
    await unlockMutation.mutateAsync({ voieId, rank });
  } catch (e) {
    console.error("Failed to unlock rank:", e);
  }
}
</script>

<style scoped>
.voie-card {
  transition: all 0.2s ease;
}
.voie-card:hover {
  border-color: rgba(99, 102, 241, 0.5);
}
</style>
