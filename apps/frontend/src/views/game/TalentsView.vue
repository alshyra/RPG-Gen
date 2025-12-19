<template>
  <div class="p-4">
    <TalentTreePanel
      :talent-trees="talentTrees"
      :is-loading-talent-trees="isLoadingTalentTrees"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TalentTreePanel from "@/components/character/TalentTreePanel.vue";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useTalentTrees } from "@rpg-gen/api-client";

const currentCharacter = useCurrentCharacter();

// Get class name from character - pass as ref for reactivity
const className = computed(() => currentCharacter.value?.className || "");

// Fetch talent trees reactively based on className
const { data: talentTreesData, isLoading: isLoadingTalentTrees } = useTalentTrees(className);

const talentTrees = computed(() => talentTreesData.value || []);
</script>
