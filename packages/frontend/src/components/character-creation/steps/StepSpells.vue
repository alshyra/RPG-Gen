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
          :key="availableSpell.name"
          class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
        >
          <UiInputCheckbox
            :model-value="spellIsSelected(availableSpell.name)"
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
import { DnDRulesService } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount } from 'vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const availableSpells = computed(() => DnDRulesService
  .getAvailableSpellsForClass(primaryClass.value)
  .filter(s => s.level <= 1),
);

const spellIsSelected = (name: string) => (currentCharacter.value?.spells || []).some(s => s.name === name);

const toggleSpell = async (s: { name: string; level: number; description?: string }, selected: boolean) => {
  if (!currentCharacter.value) return;

  if (selected) {
    characterStore.learnSpell({ type: 'spell', action: 'learn', name: s.name, level: s.level, description: s.description ?? '' });
  } else {
    characterStore.forgetSpell(s.name);
  }
};

onBeforeUnmount(async () => {
  try {
    if (!currentCharacter.value?.characterId) return;
    await characterStore.updateCharacter(currentCharacter.value.characterId, {
      spells: currentCharacter.value.spells || [],
    });
  } catch (err) {
    console.error('Failed to save spells on unmount:', err);
  }
});
</script>
