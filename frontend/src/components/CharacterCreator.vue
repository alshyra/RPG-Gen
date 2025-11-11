<template>
  <div class="p-4 rounded-md">
    <div class="md:flex md:items-start md:gap-6">
      <!-- Left: main controls (scrollable if content grows) -->
      <div class="md:w-2/3 mb-4 md:mb-0 max-h-[70vh] overflow-auto pr-2">
        <div class="mb-3">
          <div class="grid grid-cols-10 gap-3">
            <div class="col-span-7">
              <label class="block font-medium mb-1">Nom du personnage</label>
              <input v-model="character.name" class="input" placeholder="Ex: Aramis" />
            </div>
            <div class="col-span-3">
              <label class="block font-medium mb-1">Genre</label>
              <div class="flex gap-2">
                <button v-for="g in genders" :key="g" @click.prevent="gender = g"
                  :class="['px-3 py-1 rounded', gender === g ? 'bg-indigo-600 text-white' : 'bg-slate-800']">
                  {{ g }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block font-medium mb-1">Race</label>
          <RacePicker :allowedRaces="allowedRaces" v-model:race="character.race" />
        </div>


        <div class="mt-3">
          <label class="block font-medium mb-1">Classe (niveau 1 par défaut)</label>
          <div class="flex gap-2 items-center">
            <select v-model="primaryClass" class="input w-full">
              <option v-for="c in classesList" :key="c" :value="c">{{ c }}</option>
            </select>
            <button v-if="props.mode === 'levelup'" class="btn-ghost" @click="toggleMulticlass">{{ multiclass ?
              'Multiclasse: ON' : 'Activer multiclasse' }}</button>
          </div>
        </div>

        <div v-if="multiclass" class="mt-2">
          <label class="text-sm text-slate-400">Seconde classe</label>
          <select v-model="secondaryClass" class="input w-full mt-1">
            <option value="">— aucune —</option>
            <option v-for="c in classesList" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- ability score picker moved to the right column under the illustration -->
        <div class="text-sm text-slate-400 mt-3">PV calculés: <strong>{{ character.hp }}</strong> — Bonus maîtrise:
          <strong>{{ proficiencyBonus }}</strong>
        </div>
      </div>

      <!-- Right: portrait, fixed width -->
      <div class="md:w-1/3 flex flex-col justify-start items-center flex-shrink-0 md:sticky md:top-6">
        <div class="w-72 h-96">
          <CharacterIllustration :clazz="primaryClass" :raceId="character.race?.id" :gender="gender" />
        </div>

        <div class="w-72 mt-4">
          <AbilityScorePicker v-model:scores="baseScores" :proficiency="character.proficiency || 2" :mode="props.mode"
            :level-up-budget="levelUpBudget" :initial-scores="levelUpInitial" />
        </div>
      </div>
    </div>
    <div class="mt-4 flex justify-end">
      <button class="btn-primary" @click="applyAndSave">Enregistrer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import RacePicker from './RacePicker.vue';
import AbilityScorePicker from './AbilityScorePicker.vue';
import CharacterIllustration from './CharacterIllustration.vue';
import { characterService } from '../services/characterService';
import { DnDRulesService } from '../services/dndRulesService';

type Race = { id: string; name: string; mods: Record<string, number> };

const props = defineProps<{ world?: string; worldId?: string; initialCharacter?: any; mode?: string }>();

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

// default race: prefer human when available
const defaultRace = (allowedRaces.find(r => r.id === 'human') || allowedRaces[0]) as Race;
const character = ref<any>(props.initialCharacter ? JSON.parse(JSON.stringify(props.initialCharacter)) : { name: '', race: defaultRace, scores: {}, hp: 0, hpMax: 0, classes: [{ name: '', level: 1 }] });
const primaryClass = ref<string>(classesList[4]);
const secondaryClass = ref<string>('');
const multiclass = ref<boolean>(false);

const baseScores = ref<Record<string, number>>({ Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 });
const genders = ['male', 'female'];
const gender = ref<string>(props.initialCharacter?.gender || 'male');

// Level-up support helpers
const levelUpBudget = computed(() => (props.mode === 'levelup' ? 2 : undefined));
const levelUpInitial = computed(() => {
  if (props.mode === 'levelup') return props.initialCharacter?.scores || character.value?.scores || {};
  return undefined;
});

watch(baseScores, (v) => { /* reactive */ }, { deep: true });

function applyRacialAndCompute() {
  const race: Race | null = character.value.race;
  const raceModifiers = race?.mods || {};

  // Use service to calculate all D&D rules
  const calculated = DnDRulesService.prepareNewCharacter(
    character.value.name || 'Unnamed',
    baseScores.value,
    primaryClass.value,
    raceModifiers,
    race,
    { world: props.world, worldId: props.worldId }
  );

  // Update character with calculated values
  Object.assign(character.value, calculated);

  // Handle multiclass if needed
  if (multiclass.value && secondaryClass.value) {
    character.value.classes.push({ name: secondaryClass.value, level: 1 });
  }

  // Set portrait path
  try {
    const c = String(primaryClass.value || '').toLowerCase();
    let rId = 'human';
    if (race) {
      if (typeof race === 'string') rId = String(race).toLowerCase();
      else if ((race as any).id) rId = String((race as any).id).toLowerCase();
      else if ((race as any).name) rId = String((race as any).name).toLowerCase().replace(/\s+/g, '-');
    }
    const g = String(gender.value || 'male').toLowerCase();
    const baseUrl = ((import.meta as any).env && (import.meta as any).env.BASE_URL) ? (import.meta as any).env.BASE_URL : '/';
    character.value.portrait = `${baseUrl}images/${c}_${rId}_${g}.png`;
  } catch (e) { /* ignore */ }
}

function saveCharacter() {
  // ensure the selected world is saved with the character
  if (props.world) character.value.world = props.world;
  if (props.worldId) character.value.worldId = props.worldId;

  // ensure gender is saved
  character.value.gender = gender.value as 'male' | 'female';

  // Use CharacterService to save character
  const charId = characterService.saveCharacter(character.value);

  // redirect to the game view after saving
  router.push({ name: 'game', params: { world: props.world } });
}

function applyAndSave() {
  applyRacialAndCompute();
  saveCharacter();
}

function loadLatest() {
  const saved = characterService.getAllSavedCharacters();
  if (saved.length === 0) { alert('Aucun personnage sauvegardé'); return; }
  const latest = saved[0].data;
  character.value = latest;
  // sync UI fields
  primaryClass.value = latest.classes?.[0]?.name || primaryClass.value;
  secondaryClass.value = latest.classes?.[1]?.name || '';
  // derive baseScores from current scores if possible
  baseScores.value = { ...latest.scores };
}

const proficiencyBonus = computed(() => { return 2; });
const router = useRouter();

function toggleMulticlass() { multiclass.value = !multiclass.value; }

</script>
