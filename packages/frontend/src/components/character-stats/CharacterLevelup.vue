<template>
  <div class="p-4 rounded-md">
    <div class="md:flex md:items-start md:gap-6">
      <!-- Left: CharacterDto info and levelup preview -->
      <div class="md:w-1/3 mb-4 md:mb-0">
        <!-- Current Level -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4">
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-400">
              {{ character.classes?.[0]?.level || 1 }}
            </div>
            <div class="text-sm text-slate-400">
              {{ character.classes?.[0]?.name }}
            </div>
          </div>
        </div>

        <!-- New Level Preview -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4 border-2 border-green-600">
          <div class="text-center">
            <div class="text-sm text-slate-400 mb-2">
              Next Level
            </div>
            <div class="text-4xl font-bold text-green-500">
              {{ nextLevel }}
            </div>
          </div>
        </div>

        <!-- HP Gain -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4">
          <div class="text-sm text-slate-400 mb-2">
            HP Gain
          </div>
          <div class="flex items-center gap-2">
            <span class="text-red-400 font-bold text-lg">+{{ levelUpReward.hpGain }}</span>
            <span class="text-xs text-slate-500">
              ({{ character.hp || 0 }} → {{ (character.hp || 0) + levelUpReward.hpGain }})
            </span>
          </div>
        </div>

        <!-- ASI Indicator -->
        <div
          v-if="levelUpReward.hasASI"
          class="rounded-md bg-slate-800 border border-slate-700 p-4 mb-4 bg-yellow-900/30 border-yellow-700"
        >
          <div class="text-yellow-400 text-sm font-medium">
            ✨ Ability Score Improvement Available
          </div>
        </div>

        <!-- New Features -->
        <div
          v-if="levelUpReward.newFeatures.length > 0"
          class="rounded-md bg-slate-800 border border-slate-700 p-4"
        >
          <div class="text-sm text-slate-400 mb-2">
            New Features
          </div>
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
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4 bg-slate-900/50 p-6 text-center">
          <div class="text-lg font-medium mb-4">
            Ready to level up to {{ nextLevel }}?
          </div>
          <div class="text-sm text-slate-400 mb-6">
            {{ levelUpReward.message }}
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

        <!-- CharacterDto Preview -->
        <div class="rounded-md bg-slate-800 border border-slate-700 p-4">
          <div class="text-sm text-slate-400 mb-3">
            CharacterDto Summary
          </div>
          <div class="space-y-2 text-sm">
            <div>
              <span class="text-slate-400">Name:</span>
              <span class="ml-2 text-white">{{ character.name }}</span>
            </div>
            <div>
              <span class="text-slate-400">Race:</span>
              <span class="ml-2 text-white">{{ character.race?.name }}</span>
            </div>
            <div>
              <span class="text-slate-400">Current HP:</span>
              <span class="ml-2 text-red-400">{{ character.hp || 0 }}/{{ character.hpMax || 0 }}</span>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dndLevelUpService } from '../../services/dndLevelUpService';
import { characterServiceApi } from '../../services/characterServiceApi';
import { gameEngine } from '../../services/gameEngine';
import { useCharacterCreation } from '@/composables/useCharacterCreation';
import { useRoute } from 'vue-router';
import { useConversationStore } from '@/composables/conversationStore';

const router = useRouter();
const route = useRoute();
const { currentCharacter } = useCharacterCreation();

const conversation = useConversationStore();
const isPending = ref(false);

const character = computed(() => currentCharacter.value || {});
const currentLevel = computed(() => character.value.classes?.[0]?.level || 1);
const nextLevel = computed(() => Math.min(currentLevel.value + 1, 20));

const className = computed(() => character.value.classes?.[0]?.name || 'Fighter');
const conModifier = computed(() => {
  const conScore = character.value.scores?.Con || 10;
  return Math.floor((conScore - 10) / 2);
});

const levelUpReward = computed(() => dndLevelUpService.levelUp(
  className.value,
  currentLevel.value,
  conModifier.value,
));

const proficiencyBonus = computed(() => dndLevelUpService.getProficiencyBonus(nextLevel.value));

const buildLevelUpMessage = (updatedCharacter: any): string => `Player leveled up to ${nextLevel.value}!\nUpdated character:\n${JSON.stringify({
  name: updatedCharacter.name,
  level: nextLevel.value,
  class: className.value,
  hp: updatedCharacter.hp,
  hpMax: updatedCharacter.hpMax,
  proficiency: proficiencyBonus.value,
  newFeatures: levelUpReward.value.newFeatures,
  hasASI: levelUpReward.value.hasASI,
}, null, 2)}`;

const executeLevelUp = async (): Promise<void> => {
  const updatedCharacter = {
    ...character.value,
    classes: [
      {
        ...character.value.classes?.[0],
        level: nextLevel.value,
      },
    ],
    hp: Math.min(
      (character.value.hp || 0) + levelUpReward.value.hpGain,
      (character.value.hpMax || 0) + levelUpReward.value.hpGain,
    ),
    hpMax: (character.value.hpMax || 0) + levelUpReward.value.hpGain,
  };

  // Save to backend
  await characterServiceApi.updateCharacter(updatedCharacter as any);
  if (!updatedCharacter.characterId) return;
  // Send to backend
  const levelupMsg = buildLevelUpMessage(updatedCharacter);
  await gameEngine.sendMessage(updatedCharacter.characterId, levelupMsg);
  conversation.appendMessage('System', `✨ ${levelUpReward.value.message}`);

  // Return to game
  setTimeout(() => {
    router.push({ name: 'game', params: { world: (route.params.world as string) || '' } });
  }, 1500);
};

const handleConfirm = async (): Promise<void> => {
  if (!levelUpReward.value.success) {
    conversation.appendMessage('Error', 'Cannot level up further');
    return;
  }

  isPending.value = true;
  try {
    await executeLevelUp();
  } catch (error: any) {
    conversation.appendMessage('Error', `Level up failed: ${error.message}`);
  } finally {
    isPending.value = false;
  }
};

const handleCancel = (): void => router.back();
</script>

<style scoped></style>
