<template>
  <div class="p-4 max-w-6xl mx-auto">
    <!-- Back button -->
    <div class="mb-4">
      <button
        type="button"
        class="text-slate-400 hover:text-white flex items-center gap-2"
        @click="goBack"
      >
        ← Retour
      </button>
    </div>

    <!-- Character info header -->
    <div class="mb-6 flex items-center gap-4">
      <div
        v-if="currentCharacter?.portrait"
        class="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500"
      >
        <img :src="currentCharacter.portrait" alt="Portrait" class="w-full h-full object-cover" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-white">{{ currentCharacter?.name || 'Personnage' }}</h1>
        <div class="text-slate-400 capitalize">{{ currentCharacter?.className || 'Sans classe' }}</div>
      </div>
    </div>

    <!-- Talent Tree Panel -->
    <TalentTreePanel
      :talent-trees="talentTrees"
      :is-loading-talent-trees="isLoadingTalentTrees"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import TalentTreePanel from "@/components/character/TalentTreePanel.vue";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useTalentTrees } from "@rpg-gen/api-client";

const router = useRouter();
const currentCharacter = useCurrentCharacter();

// Get talent trees for the character's class
const className = computed(() => currentCharacter.value?.className || "");
const { data: talentTreesData, isLoading: isLoadingTalentTrees } = useTalentTrees(className.value);

const talentTrees = computed(() => talentTreesData.value || []);

function goBack() {
  if (currentCharacter.value?.characterId) {
    router.push({ name: "game", params: { characterId: currentCharacter.value.characterId } });
  } else {
    router.push({ name: "home" });
  }
}
</script>
