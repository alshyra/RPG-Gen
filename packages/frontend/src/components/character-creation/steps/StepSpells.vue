<template>
  <div class="p-2 lg:p-4">
    <h3 class="font-semibold mb-4">
      Sorts
    </h3>

    <div
      v-if="!currentCharacter"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div v-else-if="isLoadingSpells">
      <div class="text-sm text-slate-400">
        Chargement des sorts...
      </div>
    </div>

    <div v-else>
      <div
        v-if="cantrips.length === 0 && spells.length === 0"
        class="text-sm text-slate-400"
      >
        Vous ne pouvez pas apprendre de sorts pour cette classe.
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <!-- Cantrips Section -->
        <div v-if="cantrips.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-sm">
              Sorts mineurs (Cantrips)
            </h4>
            <span
              :class="[
                'text-xs px-2 py-1 rounded',
                selectedCantripsCount > cantripsKnown ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-300'
              ]"
            >
              {{ selectedCantripsCount }} / {{ cantripsKnown }}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="cantrip in cantrips"
              :key="cantrip.definitionId"
              class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
            >
              <UiInputCheckbox
                :name="`spell-${cantrip.name}`"
                :model-value="spellIsSelected(cantrip.definitionId)"
                :disabled="!spellIsSelected(cantrip.definitionId) && selectedCantripsCount >= cantripsKnown"
                @update:model-value="(val) => toggleSpell(cantrip, val)"
              >
                <div class="flex-1">
                  <div class="font-medium">
                    {{ cantrip.name }}
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ cantrip.description }}
                  </div>
                </div>
              </UiInputCheckbox>
            </div>
          </div>
        </div>

        <!-- Spells Section -->
        <div v-if="spells.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-sm">
              Sorts (Niveau 1+)
            </h4>
            <span
              :class="[
                'text-xs px-2 py-1 rounded',
                selectedSpellsCount > spellsKnown ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-300'
              ]"
            >
              {{ selectedSpellsCount }} / {{ spellsKnown }}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="spell in spells"
              :key="spell.definitionId"
              class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
            >
              <UiInputCheckbox
                :name="`spell-${spell.name}`"
                :model-value="spellIsSelected(spell.definitionId)"
                :disabled="!spellIsSelected(spell.definitionId) && selectedSpellsCount >= spellsKnown"
                @update:model-value="(val) => toggleSpell(spell, val)"
              >
                <div class="flex-1">
                  <div class="font-medium">
                    {{ spell.name }} <span class="text-xs text-slate-400">Niv {{ spell.level }}</span>
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ spell.description }}
                  </div>
                </div>
              </UiInputCheckbox>
            </div>
          </div>
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
const cantripsKnown = ref(0);
const spellsKnown = ref(0);

// Separate cantrips (level 0) from spells (level 1+)
const cantrips = computed(() => availableSpells.value.filter(s => s.level === 0));
const spells = computed(() => availableSpells.value.filter(s => (s.level ?? 0) > 0));

// Count selected cantrips and spells
const selectedCantripsCount = computed(() => {
  if (!currentCharacter.value?.spells) return 0;
  return currentCharacter.value.spells.filter(s => s.level === 0).length;
});

const selectedSpellsCount = computed(() => {
  if (!currentCharacter.value?.spells) return 0;
  return currentCharacter.value.spells.filter(s => (s.level) > 0).length;
});

// Fetch spells from backend when class is set
const setDefaultSpells = () => {
  availableSpells.value = [];
  cantripsKnown.value = 0;
  spellsKnown.value = 0;
};

const applyOptions = (options: any) => {
  availableSpells.value = options.unlockedSpells || [];
  cantripsKnown.value = options.cantripsKnown || 0;
  spellsKnown.value = options.spellsKnown || 0;
};

const loadSpellsForClass = async (className: string | undefined) => {
  if (!className) {
    setDefaultSpells();
    return;
  }

  isLoadingSpells.value = true;
  try {
    const options = await classesApi.getLevelOptions(className, 1);
    applyOptions(options);
  } catch (err) {
    console.error('Failed to fetch spells for class:', err);
    setDefaultSpells();
  } finally {
    isLoadingSpells.value = false;
  }
};

watch(primaryClass, (className) => {
  void loadSpellsForClass(className);
}, { immediate: true });

const spellIsSelected = (definitionId: string) => (currentCharacter.value?.spells || []).some(s => s.definitionId === definitionId);

const persistSpells = async () => {
  if (!currentCharacter.value?.characterId) return;
  try {
    await characterStore.updateCharacter(currentCharacter.value.characterId, { spells: currentCharacter.value.spells || [] });
  } catch (err) {
    console.error('Failed to persist spells:', err);
  }
};

const canAddSpell = (s: SpellResponseDto) => {
  const isCantrip = s.level === 0;
  return isCantrip ? selectedCantripsCount.value < cantripsKnown.value : selectedSpellsCount.value < spellsKnown.value;
};

const toggleSpell = async (s: SpellResponseDto, selected: boolean) => {
  if (!currentCharacter.value || !s.definitionId) return;

  if (selected) {
    // Check limits before adding
    if (!canAddSpell(s)) return;

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

  await persistSpells();
};

onBeforeUnmount(async () => {
  await persistSpells();
});
</script>
