<template>
  <div class="p-2 lg:p-4">
    <h3 class="font-semibold mb-4">Compétences de Combat</h3>

    <div
      v-if="!currentCharacter"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div v-else-if="isLoadingCombat">
      <div class="text-sm text-slate-400">Chargement des compétences de combat...</div>
    </div>

    <div v-else>
      <div
        v-if="availableCombatOptions.length === 0"
        class="text-sm text-slate-400"
      >
        Vous n'avez pas accès à des compétences de combat pour cette classe.
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="option in availableCombatOptions"
            :key="option.id"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-start gap-3"
          >
            <UiInputCheckbox
              :name="`combat-${option.id}`"
              :model-value="combatIsSelected(option.id)"
              @update:model-value="(val: boolean) => toggleCombatOption(option, val)"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ option.name }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ option.description }}
                </div>
              </div>
            </UiInputCheckbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiInputCheckbox } from '@rpg-gen/ui';
import { classesApi } from '@rpg-gen/api-client';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, ref } from 'vue';
import { CombatOptionDto } from '@rpg-gen/shared';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const availableCombatOptions = ref<CombatOptionDto[]>([]);
const isLoadingCombat = ref(false);

// Load combat options for the current class
const loadCombatOptions = async () => {
  const className = primaryClass.value;

  isLoadingCombat.value = true;
  try {
    const options = await classesApi.getLevelOptions(className, 1);
    availableCombatOptions.value = options.combatOptions || [];
  } catch (err) {
    console.error('Failed to fetch combat options for class:', err);
    availableCombatOptions.value = [];
  } finally {
    isLoadingCombat.value = false;
  }
};

const combatIsSelected = (optionId: string) =>
  (currentCharacter.value?.selectedCombatProficiencies || []).includes(optionId);

const persistCombatSelections = async () => {
  if (!currentCharacter.value?.characterId) return;
  try {
    await characterStore.updateCharacter(currentCharacter.value.characterId, {
      selectedCombatProficiencies: currentCharacter.value.selectedCombatProficiencies || [],
    });
  } catch (err) {
    console.error('Failed to persist combat selections:', err);
  }
};

const toggleCombatOption = async (option: CombatOptionDto, selected: boolean) => {
  if (!currentCharacter.value) return;

  const proficiencies = currentCharacter.value.selectedCombatProficiencies || [];

  if (selected) {
    // Add if not already present
    if (!proficiencies.includes(option.id)) {
      proficiencies.push(option.id);
    }
  } else {
    // Remove if present
    const idx = proficiencies.indexOf(option.id);
    if (idx >= 0) {
      proficiencies.splice(idx, 1);
    }
  }

  // Update store
  if (!currentCharacter.value.selectedCombatProficiencies) {
    currentCharacter.value.selectedCombatProficiencies = [];
  }
  currentCharacter.value.selectedCombatProficiencies = proficiencies;

  await persistCombatSelections();
};

loadCombatOptions();

onBeforeUnmount(async () => persistCombatSelections());

</script>
