<template>
  <div>
    <UiButton
      variant="primary"
      :is-loading="isLoading || gameStore.sending"
      @click="onClick"
    >
      {{ pendingInstruction?.type === 'roll' ? 'Roll 🎲' : 'Envoyer' }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { isRollInstruction } from '@/types/game-instructions';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { UiButton } from '@rpg-gen/ui';

const emit = defineEmits<(e: 'send') => void>();

const props = defineProps<{
  expr: string;
}>();

const gameStore = useGameStore();
const { pendingInstruction } = storeToRefs(gameStore);
const isLoading = ref(false);

const send = async () => emit('send');

const onClick = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (pendingInstruction.value && isRollInstruction(pendingInstruction.value)) {
      // Get advantage/disadvantage from the game instruction
      const advantage = pendingInstruction.value.advantage ?? 'none';
      await gameStore.doRoll(props.expr, advantage);
    } else {
      await send();
    }
  } finally {
    isLoading.value = false;
  }
};

// keep script minimal
</script>
