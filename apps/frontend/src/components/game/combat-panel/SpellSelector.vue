<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/60"
    @click.self="close"
  >
    <div class="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <h3 class="text-lg font-semibold text-slate-100 mb-4">Choisir une action</h3>

      <div class="text-xs text-slate-400 mb-4">
        PA: {{ actionRemaining }} / {{ actionMax }}
      </div>

      <div class="space-y-2 mb-4">
        <!-- Basic attack aptitude -->
        <UiButton
          class="w-full"
          :disabled="!canUseBasicAttack"
          :variant="canUseBasicAttack ? 'secondary' : 'ghost'"
          @click="useBasicAttack"
        >
          ⚔️ Attaque de base ({{ BASIC_ATTACK_COST }} PA)
        </UiButton>

        <!-- Available aptitudes -->
        <div
          v-if="availableAptitudes.length > 0"
          class="space-y-2"
        >
          <p class="text-sm text-slate-400 mt-3 mb-2">Aptitudes disponibles:</p>
          <UiButton
            v-for="aptitude in availableAptitudes"
            :key="aptitude.aptitudeId"
            :disabled="!canUseAptitude(aptitude)"
            :variant="canUseAptitude(aptitude) ? 'secondary' : 'ghost'"
            class="w-full text-left"
            @click="useAptitude(aptitude)"
          >
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ getCategoryIcon(aptitude.category) }} {{ aptitude.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="canUseAptitude(aptitude) ? 'bg-purple-500/20 text-purple-200' : 'bg-slate-700 text-slate-500'"
                >
                  {{ aptitude.paCost }} PA
                </span>
              </div>
              <div class="text-xs text-slate-400">
                {{ aptitude.description }}
              </div>
              <div v-if="aptitude.cooldown > 0" class="text-xs text-amber-400">
                Cooldown: {{ aptitude.cooldown }} tours
              </div>
            </div>
          </UiButton>
        </div>

        <p
          v-else
          class="text-sm text-slate-500 italic mt-3"
        >
          Aucune aptitude apprise
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
import { useCharacterId } from '@/composables/useCharacterId';
import { useCombat } from '@/composables/useCombat';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import type { CombatantDto, AptitudeResponseDto } from '@rpg-gen/shared';
import { useCombat as useCombatApi } from '@rpg-gen/api-client';
import { UiButton } from '@rpg-gen/ui';
import { computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  target: CombatantDto | null;
}>();

const characterId = useCharacterId();
const currentCharacter = useCurrentCharacter();
const { endTurn } = useCombatEngine();
const { executeAptitude } = useCombat();

const { status } = useCombatApi(characterId);

const actionRemaining = computed(() => status.data.value?.player?.pa ?? 0);
const actionMax = computed(() => status.data.value?.player?.paMax ?? 6);

const emit = defineEmits<{
  close: [];
  attack: [aptitudeId: string, target: CombatantDto];
}>();

// Get character aptitudes
const characterAptitudes = computed<AptitudeResponseDto[]>(() => {
  return currentCharacter?.value?.aptitudes || [];
});

// Filter to combat-usable aptitudes (attack, defense, support categories)
const availableAptitudes = computed(() => {
  return characterAptitudes.value.filter(apt => 
    apt.category === 'attack' || 
    apt.category === 'defense' || 
    apt.category === 'support'
  );
});

// Basic attack constants
const BASIC_ATTACK_ID = 'com_frappe_basique';
const BASIC_ATTACK_COST = 2; // Standard PA cost for basic attack

// Check if player can still act
const canAct = computed(() => (actionRemaining.value ?? 0) > 0);

// Check if basic attack is available
const canUseBasicAttack = computed(() => (actionRemaining.value ?? 0) >= BASIC_ATTACK_COST);

// Check if aptitude can be used
const canUseAptitude = (aptitude: AptitudeResponseDto): boolean => {
  return canAct.value && (actionRemaining.value ?? 0) >= aptitude.paCost;
};

// Get icon for aptitude category
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    attack: '⚔️',
    defense: '🛡️',
    support: '✨',
    movement: '🏃',
    utility: '🔧',
  };
  return icons[category] || '•';
};

const close = () => {
  emit('close');
};

const useBasicAttack = async () => {
  if (!props.target || !canUseBasicAttack.value) return;
  
  await executeAptitude(props.target, BASIC_ATTACK_ID);
  emit('attack', BASIC_ATTACK_ID, props.target);
  close();
};

const useAptitude = async (aptitude: AptitudeResponseDto) => {
  if (!props.target || !canUseAptitude(aptitude)) return;
  
  await executeAptitude(props.target, aptitude.aptitudeId);
  emit('attack', aptitude.aptitudeId, props.target);
  close();
};

const onEndTurn = () => {
  emit('close');
  endTurn();
};
</script>
