<template>
  <div class="p-4 rounded-md max-w-4xl mx-auto">
    <!-- Progress indicator -->
    <div class="flex justify-between mb-8">
      <div
        v-for="(s, i) in steps"
        :key="i"
        :class="['flex-1 text-center pb-2 px-2', i <= currentStep ? 'border-b-2 border-indigo-600' : 'border-b border-slate-600']"
      >
        <div
          :class="['font-medium', i === currentStep ? 'text-indigo-400' : i < currentStep ? 'text-green-400' : 'text-slate-500']"
        >
          {{ s }}
        </div>
      </div>
    </div>

    <!-- Step 1: Basic Info -->
    <div
      v-if="currentStep === 0"
      class="space-y-4"
    >
      <h2 class="text-xl font-bold">
        Informations de base
      </h2>

      <div>
        <label class="block font-medium mb-2">Nom du personnage</label>
        <input
          v-model="character.name"
          class="input w-full"
          placeholder="Ex: Aragorn"
        >
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-2">Genre</label>
          <div class="flex gap-2">
            <button
              v-for="g in genders"
              :key="g"
              :class="['flex-1 px-3 py-2 rounded', gender === g ? 'bg-indigo-600 text-white' : 'bg-slate-800']"
              @click.prevent="gender = g"
            >
              {{ g === 'male' ? '♂️ Homme' : '♀️ Femme' }}
            </button>
          </div>
        </div>

        <div v-if="props.world">
          <label class="block font-medium mb-2">Monde</label>
          <div class="text-slate-300 py-2 px-3 bg-slate-800 rounded">
            {{ props.world }}
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <UiButton
          variant="ghost"
          @click="cancel"
        >
          Annuler
        </UiButton>
        <UiButton
          variant="primary"
          :disabled="!character.name"
          @click="nextStep"
        >
          Suivant
        </UiButton>
      </div>
    </div>

    <!-- Step 2: Race & Class -->
    <div
      v-if="currentStep === 1"
      class="space-y-4"
    >
      <h2 class="text-xl font-bold">
        Race et Classe
      </h2>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-2">Race</label>
          <RacePicker
            v-model:race="character.race"
            :allowed-races="allowedRaces"
          />
        </div>

        <div>
          <label class="block font-medium mb-2">Classe</label>
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
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <UiButton
          variant="ghost"
          @click="previousStep"
        >
          Retour
        </UiButton>
        <UiButton
          variant="primary"
          :disabled="!character.race || !primaryClass"
          @click="nextStep"
        >
          Suivant
        </UiButton>
      </div>
    </div>

    <!-- Step 3: Ability Scores -->
    <div
      v-if="currentStep === 2"
      class="space-y-4"
    >
      <h2 class="text-xl font-bold">
        Scores de capacités
      </h2>
      <p class="text-slate-400 text-sm">
        Répartissez vos scores parmi les 6 capacités
      </p>

      <AbilityScorePicker
        v-model:scores="baseScores"
        :proficiency="2"
      />

      <div class="flex justify-end gap-2 mt-6">
        <UiButton
          variant="ghost"
          @click="previousStep"
        >
          Retour
        </UiButton>
        <UiButton
          variant="primary"
          @click="nextStep"
        >
          Suivant
        </UiButton>
      </div>
    </div>

    <!-- Step 4: Skills -->
    <div
      v-if="currentStep === 3"
      class="space-y-4"
    >
      <h2 class="text-xl font-bold">
        Compétences
      </h2>
      <p class="text-slate-400 text-sm">
        Sélectionnez {{ skillsToChoose }} compétences pour votre {{ primaryClass
        }}
      </p>

      <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
        <label
          v-for="skill in availableSkills"
          :key="skill"
          class="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-800 transition"
        >
          <input
            v-model="selectedSkills"
            type="checkbox"
            :value="skill"
            :disabled="selectedSkills.length >= skillsToChoose && !selectedSkills.includes(skill)"
            class="rounded"
          >
          <span>{{ skill }}</span>
        </label>
      </div>

      <div class="text-sm text-slate-400">
        Sélectionnés: {{ selectedSkills.length }}/{{ skillsToChoose }}
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <UiButton
          variant="ghost"
          @click="previousStep"
        >
          Retour
        </UiButton>
        <UiButton
          variant="primary"
          :disabled="selectedSkills.length !== skillsToChoose"
          @click="finishCreation"
        >
          Créer
        </UiButton>
      </div>
    </div>

    <!-- Character Preview -->
    <div class="mt-8 p-4 bg-slate-900 rounded border border-slate-700">
      <h3 class="font-bold mb-2">
        Aperçu du personnage
      </h3>
      <div class="text-sm text-slate-300 space-y-1">
        <div><strong>Nom:</strong> {{ character.name || '—' }}</div>
        <div><strong>Genre:</strong> {{ gender }}</div>
        <div><strong>Race:</strong> {{ character.race?.name || '—' }}</div>
        <div><strong>Classe:</strong> {{ primaryClass }}</div>
        <div v-if="currentStep >= 2">
          <strong>Scores:</strong> STR {{ baseScores.Str }} | DEX {{ baseScores.Dex
          }} | CON {{ baseScores.Con }} | INT {{ baseScores.Int }} | WIS {{ baseScores.Wis }} | CHA {{
            baseScores.Cha }}
        </div>
        <div v-if="currentStep >= 3">
          <strong>Compétences:</strong> {{ selectedSkills.join(', ') || '—' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import RacePicker from './RacePicker.vue';
import AbilityScorePicker from '../character-stats/AbilityScorePicker.vue';
import UiButton from '../ui/UiButton.vue';
import UiSelect from '../ui/UiSelect.vue';
import { characterService } from '../../services/characterService';
import { DnDRulesService } from '../../services/dndRulesService';

type Race = { id: string; name: string; mods: Record<string, number> };

const props = defineProps<{ world?: string; worldId?: string }>();
const router = useRouter();

const steps = ['Informations', 'Race & Classe', 'Capacités', 'Compétences'];
const currentStep = ref(0);

const allowedRaces: Race[] = [
    { id: 'human', name: 'Humain', mods: { Str: 1, Dex: 1, Con: 1, Int: 1, Wis: 1, Cha: 1 } },
    { id: 'dwarf', name: 'Nain', mods: { Con: 2 } },
    { id: 'elf', name: 'Elfe', mods: { Dex: 2 } },
    { id: 'halfling', name: 'Halfelin', mods: { Dex: 2 } },
    { id: 'gnome', name: 'Gnome', mods: { Int: 2 } },
    { id: 'half-elf', name: 'Demi-elfe', mods: { Cha: 2 } },
    { id: 'half-orc', name: 'Demi-orc', mods: { Str: 2, Con: 1 } },
    { id: 'tiefling', name: 'Tieffelin', mods: { Cha: 2, Int: 1 } },
    { id: 'dragonborn', name: 'Drakéide', mods: { Str: 2, Cha: 1 } }
];

const classesList = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const genders = ['male', 'female'];

const character = ref<any>({ name: '', race: null, scores: {} });
const primaryClass = ref('Fighter');
const baseScores = ref({ Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 });
const gender = ref('male');
const selectedSkills = ref<string[]>([]);

const availableSkills = computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value));
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

function nextStep() {
    if (currentStep.value < steps.length - 1) {
        currentStep.value++;
    }
}

function previousStep() {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
}

function cancel() {
    router.back();
}

function finishCreation() {
    // Set basic fields
    character.value.gender = gender.value as 'male' | 'female';
    character.value.world = props.world;
    character.value.worldId = props.worldId;

    // Generate portrait
    const c = String(primaryClass.value).toLowerCase();
    const rId = character.value.race?.id?.toLowerCase() || 'human';
    const g = String(gender.value).toLowerCase();
    const baseUrl = ((import.meta as any).env && (import.meta as any).env.BASE_URL) ? (import.meta as any).env.BASE_URL : '/';
    character.value.portrait = `${baseUrl}images/${c}_${rId}_${g}.png`;

    // Use service to calculate all D&D rules with skills
    const calculated = DnDRulesService.prepareNewCharacter(
        character.value.name || 'Unnamed',
        baseScores.value,
        primaryClass.value,
        character.value.race?.mods || {},
        character.value.race,
        { world: props.world, worldId: props.worldId },
        selectedSkills.value
    );

    // Merge with character data
    const finalCharacter = { ...character.value, ...calculated };

    // Save and redirect
    characterService.saveCharacter(finalCharacter);
    router.push({ name: 'game', params: { world: props.world } });
}
</script>
