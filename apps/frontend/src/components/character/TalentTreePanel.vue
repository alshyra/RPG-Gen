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
    <div v-if="isLoadingTalentTrees" class="flex items-center justify-center py-8">
      <UiLoader />
    </div>

    <!-- No class selected -->
    <div v-else-if="!className" class="text-center py-8 text-slate-400">
      <p>Sélectionnez d'abord une classe pour voir l'arbre de talents</p>
    </div>

    <!-- Talent Trees Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      <div
        v-for="voie in talentTrees"
        :key="voie.id"
        class="voie-card bg-slate-800/50 rounded-xl p-4 border border-slate-700"
      >
        <!-- Voie Header -->
        <div class="text-center mb-4">
          <h4 class="text-lg font-bold text-indigo-400">{{ voie.name }}</h4>
          <div class="text-xs text-slate-500 mt-1">
            {{ getUnlockedRanksCount(voie.id) }}/5 rangs débloqués
          </div>
        </div>

        <!-- Ranks -->
        <div class="space-y-3">
          <button
            v-for="rank in voie.ranks"
            :key="rank.rank"
            type="button"
            :disabled="!canUnlockRank(voie.id, rank.rank)"
            :class="[
              'w-full p-3 rounded-lg transition-all duration-200 text-left',
              getRankButtonClasses(voie.id, rank.rank),
            ]"
            @click="handleUnlockRank(voie.id, rank.rank)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <!-- Rank indicator -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isRankUnlocked(voie.id, rank.rank)
                      ? 'bg-green-500 text-white'
                      : canUnlockRank(voie.id, rank.rank)
                        ? 'bg-yellow-500 text-black'
                        : 'bg-slate-700 text-slate-500',
                  ]"
                >
                  {{ rank.rank }}
                </div>
                <!-- Aptitude info -->
                <div>
                  <div class="text-sm font-medium text-white">
                    {{ getAptitudeName(rank.aptitudeId) }}
                  </div>
                  <div class="text-xs text-slate-500">
                    {{ rank.pointCost }} point{{ rank.pointCost > 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
              <!-- Status icon -->
              <div>
                <span v-if="isRankUnlocked(voie.id, rank.rank)" class="text-green-400">✓</span>
                <span v-else-if="canUnlockRank(voie.id, rank.rank)" class="text-yellow-400">⭐</span>
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
import { computed, ref } from "vue";
import { useUnlockRank } from "@rpg-gen/api-client";
import { UiLoader } from "@rpg-gen/ui";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCharacterId } from "@/composables/useCharacterId";

// Props
interface TalentRank {
  rank: number;
  aptitudeId: string;
  pointCost: number;
}

interface TalentTree {
  id: string;
  name: string;
  ranks: TalentRank[];
}

const props = defineProps<{
  talentTrees?: TalentTree[];
  isLoadingTalentTrees?: boolean;
}>();

// Character data
const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const unlockMutation = useUnlockRank(characterId.value);

// Computed
const className = computed(() => currentCharacter.value?.className);
const talentPoints = computed(() => currentCharacter.value?.talentPoints || 0);
const unlockedRanks = computed(() => currentCharacter.value?.unlockedRanks || []);

const talentTrees = computed<TalentTree[]>(() => {
  if (props.talentTrees) return props.talentTrees;
  
  // Default empty state if no talent trees provided
  return [];
});

// Aptitude names cache (in real app, fetch from API)
const aptitudeNames = ref<Record<string, string>>({
  // Guerrier - Protection
  bouclier_heroique: "Bouclier Héroïque",
  mur_de_fer: "Mur de Fer",
  bastion: "Bastion",
  forteresse: "Forteresse",
  avatar_protection: "Avatar de la Protection",
  // Guerrier - Destruction
  frappe_puissante: "Frappe Puissante",
  charge_devastatrice: "Charge Dévastatrice",
  tourbillon: "Tourbillon",
  execution: "Exécution",
  avatar_destruction: "Avatar de la Destruction",
  // Guerrier - Tactique
  commandement: "Commandement",
  ralliment: "Ralliement",
  strategie: "Stratégie",
  inspiration: "Inspiration",
  avatar_tactique: "Avatar Tactique",
  // Rogue - Ombre
  furtivite: "Furtivité",
  pas_ombre: "Pas de l'Ombre",
  disparition: "Disparition",
  assassinat: "Assassinat",
  avatar_ombre: "Avatar de l'Ombre",
  // Rogue - Précision
  visee: "Visée",
  point_faible: "Point Faible",
  coup_critique: "Coup Critique",
  perforation: "Perforation",
  avatar_precision: "Avatar de la Précision",
  // Rogue - Ruse
  feinte: "Feinte",
  diversion: "Diversion",
  poison: "Poison",
  piege: "Piège",
  avatar_ruse: "Avatar de la Ruse",
  // Mage - Destruction
  boule_de_feu: "Boule de Feu",
  eclair: "Éclair",
  tempete_arcanique: "Tempête Arcanique",
  desintegration: "Désintégration",
  avatar_destruction_magique: "Avatar de la Destruction",
  // Mage - Protection
  armure_magique: "Armure Magique",
  barriere: "Barrière",
  contresort: "Contresort",
  immunite: "Immunité",
  avatar_protection_magique: "Avatar de la Protection",
  // Mage - Manipulation
  ralentissement: "Ralentissement",
  telekinesie: "Télékinésie",
  controle_mental: "Contrôle Mental",
  metamorphose: "Métamorphose",
  avatar_manipulation: "Avatar de la Manipulation",
});

// Methods
function getAptitudeName(aptitudeId: string): string {
  return aptitudeNames.value[aptitudeId] || aptitudeId;
}

function isRankUnlocked(voieId: string, rank: number): boolean {
  return unlockedRanks.value.some(
    (r) => r.voieId === voieId && r.rank === rank
  );
}

function canUnlockRank(voieId: string, rank: number): boolean {
  // Already unlocked?
  if (isRankUnlocked(voieId, rank)) return false;
  
  // Not enough points?
  if (talentPoints.value < 1) return false;
  
  // Rank 1 can always be unlocked (if points available)
  if (rank === 1) return true;
  
  // Higher ranks need previous rank unlocked
  return isRankUnlocked(voieId, rank - 1);
}

function getUnlockedRanksCount(voieId: string): number {
  return unlockedRanks.value.filter((r) => r.voieId === voieId).length;
}

function getRankButtonClasses(voieId: string, rank: number): string {
  if (isRankUnlocked(voieId, rank)) {
    return "bg-green-500/20 border border-green-500/50 cursor-default";
  }
  if (canUnlockRank(voieId, rank)) {
    return "bg-yellow-500/10 border border-yellow-500/50 hover:bg-yellow-500/20 cursor-pointer";
  }
  return "bg-slate-700/30 border border-slate-600/30 cursor-not-allowed opacity-60";
}

async function handleUnlockRank(voieId: string, rank: number) {
  if (!canUnlockRank(voieId, rank)) return;
  
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
