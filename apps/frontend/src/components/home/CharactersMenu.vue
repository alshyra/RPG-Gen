<template>
  <div class="space-y-8">
    <!-- Draft Characters Section -->
    <CharacterSection
      title="Reprendre l'édition"
      :characters="drafts"
      :is-loading="isDraftLoading"
      @deleted="onCharacterDeleted"
    >
      <template #empty-state>
        Aucun brouillon. Crée un nouveau personnage pour commencer!
      </template>
    </CharacterSection>

    <!-- Created Characters Section -->
    <CharacterSection
      title="✅ Personnages créés (prêts à jouer)"
      :characters="created"
      :is-loading="isCreatedLoading"
      @deleted="onCharacterDeleted"
      v-if="created.length > 0"
    >
      <template #empty-state>
        Aucun personnage créé. Termine un brouillon pour le rendre jouable!
      </template>
    </CharacterSection>
  </div>
</template>

<script setup lang="ts">
import { useDraftCharacters, useCreatedCharacters } from "@rpg-gen/api-client";
import CharacterSection from "./CharacterSection.vue";
import { computed } from "vue";

const draftsList = useDraftCharacters();
const createdList = useCreatedCharacters();

const drafts = computed(() => draftsList.data.value || []);
const created = computed(() => createdList.data.value || []);
const isDraftLoading = computed(() => draftsList.isLoading.value);
const isCreatedLoading = computed(() => createdList.isLoading.value);

const onCharacterDeleted = () => {
  // Refetch both lists after deletion
  draftsList.refetch();
  createdList.refetch();
};
</script>

<style scoped></style>
