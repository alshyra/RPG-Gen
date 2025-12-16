<template>
  <label class="block font-medium mb-2">Classe</label>
  <UiSelect
    :model-value="currentCharacter?.classes?.[0]?.name ?? CLASSES_LIST[0]"
    @update:model-value="updateClass($event)"
  >
    <option
      v-for="rpg_classe in CLASSES_LIST"
      :key="rpg_classe"
      :value="rpg_classe"
    >
      {{ rpg_classe }}
    </option>
  </UiSelect>
</template>

<script setup lang="ts">
import { useCharacterId } from "@/composables/useCharacterId";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { CLASSES_LIST, DnDRulesService } from "@/services/dndRulesService";
import { useCharacter } from "@rpg-gen/api-client";
import { UiSelect } from "@rpg-gen/ui";

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const { update } = useCharacter(characterId);

const updateClass = async (newClass: string) => {
  await update.mutateAsync({
    classes: [
      {
        name: newClass,
        level: 1,
      },
    ],
    skills: DnDRulesService.getAvailableSkillsForClass(newClass).map((skill) => ({
      name: skill,
      proficient: false,
    })),
  });
};
</script>
