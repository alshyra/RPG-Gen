<template>
  <div class="p-4 rounded-md">
    <div class="md:flex md:items-start md:gap-6">
      <!-- Left: Character info and levelup preview -->
      <div class="md:w-1/3 mb-4 md:mb-0">
        <!-- Current Level -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-400">
              {{ currentCharacter?.classes?.[0]?.level || 1 }}
            </div>
            <div class="text-sm text-slate-400">
              {{ currentCharacter?.classes?.[0]?.name }}
            </div>
          </div>
        </div>

        <!-- New Level Preview -->
        <div class="rounded-md bg-slate-800 border-2 border-green-600 p-4 mb-4">
          <div class="text-center">
            <div class="text-sm text-slate-400 mb-2">Next Level</div>
            <div class="text-4xl font-bold text-green-500">
              {{ nextLevel }}
            </div>
          </div>
        </div>

        <!-- HP Gain -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4">
          <div class="text-sm text-slate-400 mb-2">HP Gain</div>
          <div class="flex items-center gap-2">
            <span class="text-red-400 font-bold text-lg">+{{ levelUpReward.hpGain }}</span>
            <span class="text-xs text-slate-500">
              ({{ currentCharacter?.hp || 0 }} →
              {{ (currentCharacter?.hp || 0) + levelUpReward.hpGain }})
            </span>
          </div>
        </div>

        <!-- ASI Indicator -->
        <div
          v-if="levelUpReward.hasASI"
          class="rounded-md bg-yellow-900/30 border border-yellow-700 p-4 mb-4"
        >
          <div class="text-yellow-400 text-sm font-medium">
            ✨ Ability Score Improvement Available
          </div>
        </div>

        <!-- New Features -->
        <div
          v-if="(levelUpReward.newFeatures ?? []).length > 0"
          class="rounded-md bg-slate-800 border border-slate-700 p-4"
        >
          <div class="text-sm text-slate-400 mb-2">New Features</div>
          <ul class="space-y-1">
            <li
              v-for="(feature, idx) in levelUpReward.newFeatures"
              :key="idx"
              class="text-sm text-green-400"
            >
              ✓ {{ feature }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Right: Confirm/Cancel -->
      <div class="md:w-2/3 flex flex-col gap-3">
        <div class="rounded-md bg-slate-900/50 border border-slate-700 p-6 text-center">
          <div class="text-lg font-medium mb-4">Ready to level up to {{ nextLevel }}?</div>
          <div class="text-sm text-slate-400 mb-6">
            {{ levelUpReward.message }}
          </div>

          <!-- Combat Options Selection -->
          <div
            v-if="availableCombatOptions.length > 0"
            class="mb-6 rounded-md bg-slate-800 border border-slate-700 p-4"
          >
            <div class="text-sm text-slate-400 mb-3">Nouvelles Compétences de Combat</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="option in availableCombatOptions"
                :key="option.id"
                class="p-2 rounded border border-slate-600 bg-slate-900/50 cursor-pointer hover:border-indigo-500 transition"
                :class="{
                  'border-indigo-500 bg-indigo-900/30': selectedCombatIds.includes(option.id),
                }"
                @click="toggleCombatOption(option.id)"
              >
                <input
                  type="checkbox"
                  :checked="selectedCombatIds.includes(option.id)"
                  class="mr-2"
                />
                <span class="text-xs font-medium">{{ option.name }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-center">
            <button
              class="px-4 py-2 rounded font-medium transition bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
              :disabled="isPending"
              @click="handleConfirm"
            >
              <span v-if="!isPending">Confirm Level Up</span>
              <span v-else>Processing...</span>
            </button>
            <button
              class="px-4 py-2 rounded font-medium transition bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
              :disabled="isPending"
              @click="handleCancel"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Character Preview -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4">
          <div class="text-sm text-slate-400 mb-3">Character Summary</div>
          <div class="space-y-2 text-sm">
            <div>
              <span class="text-slate-400">Name:</span>
              <span class="ml-2 text-white">{{ currentCharacter?.name }}</span>
            </div>
            <div>
              <span class="text-slate-400">Race:</span>
              <span class="ml-2 text-white">{{ currentCharacter?.race?.name }}</span>
            </div>
            <div>
              <span class="text-slate-400">Current HP:</span>
              <span class="ml-2 text-red-400"
                >{{ currentCharacter?.hp || 0
                }}/{{ currentCharacter?.hpMax || 0 }}</span
              >
            </div>
            <div>
              <span class="text-slate-400">Proficiency Bonus:</span>
              <span class="ml-2 text-yellow-400">+{{ proficiencyBonus }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterId } from "@/composables/useCharacterId";
import type { LevelUpResult } from "@/interfaces";
import { useCharacter, useChat, useClasses } from "@rpg-gen/api-client";
import type { CharacterResponseDto, CombatOptionDto } from "@rpg-gen/shared";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { dndLevelUpService } from "../../services/dndLevelUpService";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";

const router = useRouter();

// State
const isPending = ref(false);
const availableCombatOptions = ref<CombatOptionDto[]>([]);
const selectedCombatIds = ref<string[]>([]);

// Character data
const characterId = useCharacterId()
const { update, applyLevelUp } = useCharacter(characterId)
const currentCharacter = useCurrentCharacter();
const chat = useChat(characterId);
const currentLevel = computed(() => currentCharacter.value?.classes?.[0]?.level || 1);
const nextLevel = computed(() => Math.min(currentLevel.value + 1, 20));

// Level up calculation
const className = computed(() => currentCharacter.value?.classes?.[0]?.name || "Fighter");
const classes = useClasses(className, nextLevel);

const conModifier = computed(() => {
  const conScore = currentCharacter.value?.scores?.Con || 10;
  return Math.floor((conScore - 10) / 2);
});

const levelUpReward = computed<LevelUpResult>(() =>
  dndLevelUpService.levelUp(className.value, currentLevel.value, conModifier.value)
);

const proficiencyBonus = computed(() => dndLevelUpService.getProficiencyBonus(nextLevel.value));



// Load combat options for the next level
onMounted(() => {
  // Options will be loaded automatically by the query
  if (classes.levelOptions.data.value) {
    availableCombatOptions.value = classes.levelOptions.data.value.combatOptions || [];
  }
});

// Watch for query data changes

watch(() => classes.levelOptions.data.value, (options) => {
  if (options) {
    availableCombatOptions.value = options.combatOptions || [];
    selectedCombatIds.value = [];
  }
});

// Handlers

const toggleCombatOption = (optionId: string): void => {
  const idx = selectedCombatIds.value.indexOf(optionId);
  if (idx >= 0) {
    selectedCombatIds.value.splice(idx, 1);
  } else {
    selectedCombatIds.value.push(optionId);
  }
};

const buildLevelUpMessage = (updatedCharacter: Partial<CharacterResponseDto>): string =>
  `Player leveled up to ${nextLevel.value}!\nUpdated character:\n${JSON.stringify(
    {
      name: updatedCharacter.name,
      level: nextLevel.value,
      class: className.value,
      hp: updatedCharacter.hp,
      hpMax: updatedCharacter.hpMax,
      proficiency: proficiencyBonus.value,
      newFeatures: levelUpReward.value.newFeatures,
      hasASI: levelUpReward.value.hasASI,
      newCombatProficiencies: selectedCombatIds.value,
    },
    null,
    2
  )}`;

const executeLevelUp = async (): Promise<void> => {
  // Update character with new level and HP
  const updatedCharacter: Partial<CharacterResponseDto> = {
    ...currentCharacter.value,
    classes: [
      {
        ...currentCharacter.value?.classes?.[0],
        level: nextLevel.value,
      },
    ],
    hp: Math.min(
      (currentCharacter.value?.hp || 0) + levelUpReward.value.hpGain,
      (currentCharacter.value?.hpMax || 0) + levelUpReward.value.hpGain
    ),
    hpMax: (currentCharacter.value?.hpMax || 0) + levelUpReward.value.hpGain,
  };

  // Save to backend using the character store mutations
  if (updatedCharacter.characterId) {
    // Use the dedicated LevelUp mutation with combat selections
    try {
      await applyLevelUp.mutateAsync({
        className: className.value,
        body: {
          newSpellIds: [],
          abilityIncreases: [],
          selectedCombatProficiencies: selectedCombatIds.value,
        },
      });
    } catch {
      // Fallback: save the computed character changes
      await update.mutateAsync(updatedCharacter);
    }
  }

  // Send to backend using chat mutation
  if (!updatedCharacter.characterId) return;
  const levelupMsg = buildLevelUpMessage(updatedCharacter);
  await chat.sendMessage.mutateAsync({
    role: "user",
    narrative: levelupMsg,
    instructions: [],
  });

  // Return to game
  setTimeout(() => {
    router.push({
      name: "game",
      params: { characterId: characterId.value }
    });
  }, 1500);
};

const handleConfirm = async (): Promise<void> => {
  if (!levelUpReward.value.success) {
    return;
  }

  isPending.value = true;
  try {
    await executeLevelUp();
  } catch {
    // Handle error
  } finally {
    isPending.value = false;
  }
};

const handleCancel = (): void => router.back();
</script>

<style scoped></style>
