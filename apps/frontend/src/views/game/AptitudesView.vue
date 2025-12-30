<template>
  <div class="p-2">
    <div class="card p-3">
      <h2 class="font-bold text-slate-200 mb-2">Aptitudes</h2>
      
      <!-- PA/PM Display -->
      <div class="flex gap-4 mb-4 p-2 bg-slate-800/60 rounded border border-slate-700/40">
        <div class="flex items-center gap-2">
          <span class="text-yellow-400">⚡</span>
          <span class="text-sm text-slate-300">
            <span class="font-bold text-yellow-400">{{ currentPa }}</span>
            <span class="text-slate-500"> / {{ maxPa }}</span>
            <span class="text-xs text-slate-400 ml-1">PA</span>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-blue-400">👟</span>
          <span class="text-sm text-slate-300">
            <span class="font-bold text-blue-400">{{ currentPm }}</span>
            <span class="text-slate-500"> / {{ maxPm }}</span>
            <span class="text-xs text-slate-400 ml-1">PM</span>
          </span>
        </div>
      </div>

      <!-- No aptitudes -->
      <div
        v-if="!hasAptitudes"
        class="text-xs text-slate-400"
      >
        Aucune aptitude apprise. Débloquez des rangs dans vos voies pour apprendre de nouvelles aptitudes.
      </div>

      <!-- Aptitudes list -->
      <ul
        v-else
        class="space-y-2"
      >
        <li
          v-for="aptitude in aptitudes"
          :key="aptitude.id"
          class="p-3 bg-slate-800/40 rounded border border-slate-700/30 hover:bg-slate-700/40 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="font-medium text-slate-100">
                {{ aptitude.name }}
              </div>
              <div
                v-if="aptitude.description"
                class="text-xs text-slate-400 mt-1"
              >
                {{ aptitude.description }}
              </div>
              
              <!-- Aptitude stats -->
              <div class="flex gap-3 mt-2 text-xs">
                <span class="text-yellow-400">
                  ⚡ {{ aptitude.paCost }} PA
                </span>
                <span
                  v-if="aptitude.cooldown"
                  class="text-purple-400"
                >
                  ⏱️ {{ aptitude.cooldown }} tours
                </span>
                <span
                  v-if="aptitude.targeting.range"
                  class="text-cyan-400"
                >
                  🎯 {{ aptitude.targeting.range }}m
                </span>
              </div>
            </div>

            <!-- Action button -->
            <button
              :disabled="!canUseAptitude(aptitude)"
              class="ml-3 text-xs px-3 py-1.5 rounded text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :class="canUseAptitude(aptitude) 
                ? 'bg-purple-600/50 hover:bg-purple-600' 
                : 'bg-slate-700'"
              @click="onUseAptitude(aptitude)"
            >
              {{ canUseAptitude(aptitude) ? 'Utiliser' : 'PA insuffisants' }}
            </button>
          </div>

          <!-- Cooldown indicator -->
          <div
            v-if="aptitude.cooldown && aptitudeOnCooldown(aptitude)"
            class="mt-2 text-xs text-orange-400"
          >
            ⏳ Disponible dans {{ remainingCooldown(aptitude) }} tour(s)
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCharacterId } from '@/composables/useCharacterId';
import { useCombat } from '@rpg-gen/api-client';
import type { AptitudeResponseDto } from '@rpg-gen/shared';
import { computed } from 'vue';

const characterId = useCharacterId();
const currentCharacter = useCurrentCharacter();
const { useAptitude } = useCombat(characterId);

// Aptitudes from character
const aptitudes = computed<AptitudeResponseDto[]>(() => {
  return currentCharacter?.value?.aptitudes || [];
});

const hasAptitudes = computed(() => aptitudes.value.length > 0);

// Current PA/PM resources
const currentPa = computed(() => currentCharacter?.value?.pa ?? 0);
const maxPa = computed(() => currentCharacter?.value?.paMax ?? 6);
const currentPm = computed(() => currentCharacter?.value?.pm ?? 0);
const maxPm = computed(() => currentCharacter?.value?.pmMax ?? 4);

// Check if character has enough PA to use aptitude
const canUseAptitude = (aptitude: AptitudeResponseDto): boolean => {
  if (!aptitude.paCost) return true;
  return currentPa.value >= aptitude.paCost;
};

// Check if aptitude is on cooldown (placeholder - needs backend cooldown tracking)
const aptitudeOnCooldown = (_aptitude: AptitudeResponseDto): boolean => {
  // TODO: Implement cooldown tracking from character state
  return false;
};

// Get remaining cooldown turns (placeholder)
const remainingCooldown = (_aptitude: AptitudeResponseDto): number => {
  // TODO: Implement cooldown tracking from character state
  return 0;
};

const onUseAptitude = async (aptitude: AptitudeResponseDto) => {
  if (!canUseAptitude(aptitude)) return;
  if (!characterId.value || !aptitude.id) return;
  
  try {
    // Call the combat API to use the aptitude
    const result = await useAptitude.mutateAsync({
      characterId: characterId.value,
      aptitudeId: aptitude.id,
      // TODO: Add target selection for aptitudes that require a target
    });
    
    if (result.success) {
      console.log('Aptitude used successfully:', result);
    } else {
      console.warn('Aptitude usage failed:', result.errorMessage);
      alert(result.errorMessage || 'Échec de l\'utilisation de l\'aptitude');
    }
  } catch (error) {
    console.error('Error using aptitude:', error);
    alert('Erreur lors de l\'utilisation de l\'aptitude');
  }
};
</script>
