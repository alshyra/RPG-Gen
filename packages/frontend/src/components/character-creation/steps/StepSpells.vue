<template>
  <div class="p-2 lg:p-4">
    <h3 class="font-semibold mb-2">
      Sorts
    </h3>

    <div
      v-if="!currentCharacter"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div v-else>
      <div
        v-if="availableSpells.length === 0"
        class="text-sm text-slate-400"
      >
        Vous ne pouvez pas apprendre de sorts pour cette classe.
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div
          v-for="availableSpell in availableSpells"
          :key="availableSpell.definitionId || availableSpell.name"
          class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
        >
          <UiInputCheckbox
            :name="`spell-${availableSpell.name}`"
            :model-value="spellIsSelected(availableSpell.definitionId || '')"
            @update:model-value="(val) => toggleSpell(availableSpell, val)"
          >
            <div class="flex-1">
              <div class="font-medium">
                {{ availableSpell.name }} <span class="text-xs text-slate-400">Niv {{ availableSpell.level }}</span>
              </div>
              <div class="text-xs text-slate-400">
                {{ availableSpell.description }}
              </div>
            </div>
          </UiInputCheckbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputCheckbox from '@/components/ui/UiInputCheckbox.vue';
import { classesApi } from '@/apis/classesApi';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import {
  computed, onBeforeUnmount, ref, watch,
} from 'vue';
import { SpellResponseDto } from '@rpg-gen/shared';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const availableSpells = ref<SpellResponseDto[]>([]);
const isLoadingSpells = ref(false);

// Fetch spells from backend when class is set
watch(primaryClass, async (className) => {
  if (!className) {
    availableSpells.value = [];
    return;
  }

  isLoadingSpells.value = true;
  try {
    const options = await classesApi.getLevelOptions(className, 1);
    availableSpells.value = options.unlockedSpells || [];
  } catch (err) {
    console.error('Failed to fetch spells for class:', err);
    availableSpells.value = [];
  } finally {
    isLoadingSpells.value = false;
  }
}, { immediate: true });

const spellIsSelected = (definitionId: string) => (currentCharacter.value?.spells || []).some(s => s.definitionId === definitionId);

const toggleSpell = async (s: SpellResponseDto, selected: boolean) => {
  if (!currentCharacter.value || !s.definitionId) return;

  if (selected) {
    characterStore.learnSpell({
      type: 'spell',
      action: 'learn',
      name: s.name,
      level: s.level,
      description: s.description ?? '',
      definitionId: s.definitionId,
    });
  } else {
    characterStore.forgetSpell(s.name);
  }
};

onBeforeUnmount(async () => {
  try {
    if (!currentCharacter.value?.characterId) return;
    await characterStore.updateCharacter(currentCharacter.value.characterId, { spells: currentCharacter.value.spells || [] });
  } catch (err) {
    console.error('Failed to save spells on unmount:', err);
  }
});
</script>
