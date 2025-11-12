<template>
  <div class="p-4 rounded-md">
    <div class="md:flex md:items-start md:gap-6">
      <!-- Left: main controls (scrollable if content grows) -->
      <div class="md:w-2/3 mb-4 md:mb-0 max-h-[70vh] overflow-auto pr-2">
        <div class="mb-3">
          <div class="grid grid-cols-10 gap-3">
            <div class="col-span-7">
              <label class="block font-medium mb-1">Nom du personnage</label>
              <input
                v-model="character.name"
                class="input"
                placeholder="Ex: Aramis"
              >
            </div>
            <div class="col-span-3">
              <label class="block font-medium mb-1">Genre</label>
              <div class="flex gap-2">
                <button
                  v-for="g in genders"
                  :key="g"
                  :class="['px-3 py-1 rounded', gender === g ? 'bg-indigo-600 text-white' : 'bg-slate-800']"
                  @click.prevent="gender = g as any"
                >
                  {{ g }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block font-medium mb-1">Race</label>
          <RacePicker
            v-model:race="character.race"
            :allowed-races="allowedRaces"
          />
        </div>

        <div class="mt-3">
          <label class="block font-medium mb-1">Classe</label>
          <div class="flex gap-2 items-center">
            <UiSelect
              v-model="primaryClass"
            >
              <option
                v-for="c in classesList"
                :key="c"
                :value="c"
              >
                {{ c }}
              </option>
            </UiSelect>
            <UiButton
              variant="ghost"
              @click="toggleMulticlass"
            >
              {{ multiclass ? 'Multiclasse: ON' : 'Activer multiclasse' }}
            </UiButton>
          </div>
        </div>

        <div
          v-if="multiclass"
          class="mt-2"
        >
          <label class="text-sm text-slate-400">Seconde classe</label>
          <UiSelect
            v-model="secondaryClass"
          >
            <option value="">
              — aucune —
            </option>
            <option
              v-for="c in classesList"
              :key="c"
              :value="c"
            >
              {{ c }}
            </option>
          </UiSelect>
        </div>

        <div class="text-sm text-slate-400 mt-3">
          PV calculés: <strong>{{ character.hp }}</strong> — Bonus maîtrise:
          <strong>{{ proficiencyBonus }}</strong>
        </div>
      </div>

      <!-- Right: portrait, fixed width -->
      <div class="md:w-1/3 flex flex-col justify-start items-center flex-shrink-0 md:sticky md:top-6">
        <div class="w-72 h-96">
          <CharacterIllustration
            :clazz="primaryClass"
            :race-id="character.race?.id"
            :gender="gender"
          />
        </div>

        <div class="w-72 mt-4">
          <AbilityScorePicker
            v-model:scores="baseScores"
            :proficiency="character.proficiency || 2"
            :mode="props.mode"
            :level-up-budget="levelUpBudget"
            :initial-scores="levelUpInitial"
          />
        </div>
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <UiButton
        variant="ghost"
        @click="cancel"
      >
        Annuler
      </UiButton>
      <UiButton
        variant="primary"
        @click="handleSave"
      >
        {{ props.mode === 'levelup' ? 'Confirmer Levelup' : 'Enregistrer' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import RacePicker from './RacePicker.vue';
import AbilityScorePicker from '../character-stats/AbilityScorePicker.vue';
import CharacterIllustration from '../character/CharacterIllustration.vue';
import UiButton from '../ui/UiButton.vue';
import UiSelect from '../ui/UiSelect.vue';
import { useCharacterCreation } from '../../composables/useCharacterCreation';
import { gameEngine } from '../../services/gameEngine';
import { useGameStore } from '../../stores/gameStore';

interface Props {
  world?: string;
  worldId?: string;
  initialCharacter?: any;
  mode: 'create' | 'levelup';
}

const props = withDefaults(defineProps<Props>(), {
  world: undefined,
  worldId: undefined,
  initialCharacter: undefined,
});

const router = useRouter();
const gameStore = useGameStore();

const {
  character,
  primaryClass,
  secondaryClass,
  multiclass,
  baseScores,
  gender,
  allowedRaces,
  classesList,
  genders,
  levelUpBudget,
  levelUpInitial,
  proficiencyBonus,
  applyRacialAndCompute,
  saveCharacter,
  toggleMulticlass,
} = useCharacterCreation(props.world, props.worldId, props.initialCharacter, props.mode);

const cancel = (): void => router.back();

const handleSave = async (): Promise<void> => {
  if (props.mode === 'levelup') {
    // For levelup: compute stats, save locally, send to backend, return to game
    applyRacialAndCompute();
    saveCharacter();

    // Send levelup message to backend
    const levelupMsg = `Player leveled up! Updated character:\n${JSON.stringify({
      name: character.value.name,
      level: character.value.classes?.[0]?.level,
      classes: character.value.classes,
      scores: character.value.scores,
      hp: character.value.hp,
      hpMax: character.value.hpMax,
    })}`;

    try {
      await gameEngine.sendMessage(levelupMsg);
      gameStore.appendMessage('System', '✨ Level up confirmed! Returning to game...');
    } catch (e: any) {
      gameStore.appendMessage('Error', 'Failed to send level up: ' + e.message);
    }

    // Return to game after a brief moment
    setTimeout(() => {
      router.push({ name: 'game', params: { world: props.world } });
    }, 1000);
  }
};
</script>

<style scoped>
</style>
