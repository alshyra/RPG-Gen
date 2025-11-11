<template>
  <div class="p-4">
    <!-- Use wizard for new character creation, old creator for edit/levelup -->
    <CharacterCreatorWizard v-if="mode === 'create'" :world="worldName" :world-id="world" />
    <CharacterCreator v-else :world="worldName" :world-id="world" :initialCharacter="initialCharacter" :mode="mode" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import CharacterCreator from '../components/CharacterCreator.vue';
import CharacterCreatorWizard from '../components/CharacterCreatorWizard.vue';
import { characterService } from '../services/characterService';

const route = useRoute();
const world = (route.params.world as string) || '';
const map: Record<string, string> = { dnd: 'Dungeons & Dragons', vtm: 'Vampire: The Masquerade', cyberpunk: 'Cyberpunk' };
const worldName = map[world] || world;

// Get character from localStorage or load current
let initialCharacter = characterService.loadCharacter();

// Determine mode based on what we loaded
const action = (route.query.action as string) || '';
let mode = 'create';
if (action === 'levelup') mode = 'levelup';
else if (initialCharacter) mode = 'edit';

</script>

<style scoped></style>