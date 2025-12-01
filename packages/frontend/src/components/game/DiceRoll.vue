<template>
  <div>
    <UiButton
      variant="primary"
      :is-loading="isLoading || gameStore.sending"
      @click="onClick"
    >
      {{ props.pendingInstruction?.type === 'roll' ? 'Roll 🎲' : 'Envoyer' }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import UiButton from '../ui/UiButton.vue';
import { ref } from 'vue';
import type { RollInstructionMessageDto } from '@rpg-gen/shared';

const emit = defineEmits<(e: 'send') => void>();

const props = defineProps<{ pendingInstruction?: RollInstructionMessageDto | null; expr: string }>();

const gameStore = useGameStore();
const isLoading = ref(false);

const send = async () => emit('send');

const onClick = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (props.pendingInstruction?.type === 'roll') {
      // Get advantage/disadvantage from the game instruction
      const advantage = props.pendingInstruction.advantage || 'none';
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
